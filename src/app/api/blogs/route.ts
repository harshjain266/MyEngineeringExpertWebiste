import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const mode = searchParams.get("mode");

    if (mode === "subjects") {
      const subjects = await prisma.blog.findMany({
        where: { published: true },
        select: { subject: true },
        distinct: ["subject"],
        orderBy: { subject: "asc" },
      });
      return NextResponse.json(subjects.map((s) => s.subject));
    }

    const where: any = { published: true };
    if (subject) where.subject = subject;

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    if (!session || (role !== "instructor" && role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, subject, featuredImage, tags, published } = await req.json();

    if (!title || !content || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) + "-" + Date.now().toString(36);

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        subject,
        featuredImage: featuredImage || null,
        tags: tags || [],
        published: published ?? false,
        authorId: (session.user as any).id,
      },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (err) {
    console.error("POST /api/blogs error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
