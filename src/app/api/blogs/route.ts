import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PUBLIC_BLOG_FILTER } from "@/lib/data";
import { buildExcerpt, readingMinutes } from "@/lib/blog";
import { notifyBlogSubmitted } from "@/lib/notify";
import { announceBlog, announceSubmission } from "@/lib/notifications";

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const mode = searchParams.get("mode");

    if (mode === "subjects") {
      const subjects = await prisma.blog.findMany({
        where: PUBLIC_BLOG_FILTER,
        select: { subject: true },
        distinct: ["subject"],
        orderBy: { subject: "asc" },
      });
      return NextResponse.json(subjects.map((s) => s.subject));
    }

    const blogs = await prisma.blog.findMany({
      where: { ...PUBLIC_BLOG_FILTER, ...(subject ? { subject } : {}) },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { name: true, avatar: true, instructor: { select: { id: true } } } },
      },
    });

    return NextResponse.json(
      blogs.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        content: b.content,
        subject: b.subject,
        featuredImage: b.featuredImage,
        tags: b.tags,
        published: b.published,
        authorId: b.authorId,
        authorName: b.author.name,
        authorAvatar: b.author.avatar ?? undefined,
        authorInstructorId: b.author.instructor?.id ?? null,
        excerpt: b.excerpt,
        readMinutes: b.readMinutes,
        views: b.views,
        featured: b.featured,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /api/blogs error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id as string | undefined;

    if (!session || !userId || !["instructor", "admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, subject, featuredImage, tags, published, excerpt } =
      await req.json();

    if (!title || !content || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Admins and the superadmin are reviewers, so their own posts skip the queue.
    const isReviewer = role === "admin" || role === "superadmin";
    const wantsPublish = published === true;

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: slugify(title),
        content,
        subject,
        featuredImage: featuredImage || null,
        tags: Array.isArray(tags) ? tags.slice(0, 12) : [],
        published: wantsPublish,
        excerpt: buildExcerpt(content, excerpt),
        readMinutes: readingMinutes(content),
        authorId: userId,
        // A draft stays pending until its author submits it for review.
        approvalStatus: isReviewer ? "approved" : "pending",
        ...(isReviewer ? { reviewedById: userId, reviewedAt: new Date() } : {}),
      },
      include: { author: { select: { name: true } } },
    });

    if (!isReviewer && wantsPublish) {
      await Promise.all([
        notifyBlogSubmitted({
          id: blog.id,
          title: blog.title,
          subject: blog.subject,
          authorId: blog.authorId,
          authorName: blog.author.name,
        }),
        announceSubmission({
          kind: "Blog",
          id: blog.id,
          title: blog.title,
          submittedBy: blog.author.name,
          authorId: blog.authorId,
        }),
      ]);
    } else if (isReviewer && wantsPublish) {
      // Reviewer posts skip the queue, so they reach students immediately.
      await announceBlog(blog.id);
    }

    return NextResponse.json(
      { ...blog, pendingApproval: !isReviewer && wantsPublish },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/blogs error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
