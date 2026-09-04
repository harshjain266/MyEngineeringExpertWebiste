import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildExcerpt, readingMinutes } from "@/lib/blog";
import { notifyBlogSubmitted } from "@/lib/notify";
import { announceBlog, announceSubmission } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true, avatar: true } },
      },
    });

    if (!blog) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // A post that is unpublished or still awaiting review is visible only to
    // its author and to reviewers — never to students via a guessed slug.
    const isLive = blog.published && blog.approvalStatus === "approved";
    if (!isLive) {
      const session = await getServerSession(authOptions);
      const viewerId = (session?.user as any)?.id;
      const viewerRole = (session?.user as any)?.role;
      const canPreview =
        viewerId === blog.authorId || viewerRole === "admin" || viewerRole === "superadmin";
      if (!canPreview) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      subject: blog.subject,
      featuredImage: blog.featuredImage,
      tags: blog.tags,
      published: blog.published,
      authorId: blog.authorId,
      authorName: blog.author.name,
      authorAvatar: blog.author.avatar ?? undefined,
      excerpt: blog.excerpt,
      readMinutes: blog.readMinutes,
      views: blog.views,
      featured: blog.featured,
      approvalStatus: blog.approvalStatus,
      reviewNote: blog.reviewNote,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/blogs/[slug] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const existing = await prisma.blog.findUnique({ where: { slug } });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isReviewer = role === "admin" || role === "superadmin";
    if (existing.authorId !== userId && !isReviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, subject, featuredImage, tags, published, excerpt } =
      await req.json();

    const nextContent = content ?? existing.content;
    const isAuthorEdit = existing.authorId === userId && !isReviewer;
    const wantsPublish = published === true;

    // An author editing their post sends it back through review; a reviewer
    // editing it keeps the decision they already made.
    const approval = isAuthorEdit
      ? { approvalStatus: "pending" as const, reviewedById: null, reviewedAt: null }
      : {};

    const blog = await prisma.blog.update({
      where: { slug },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(subject !== undefined && { subject }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.slice(0, 12) : [] }),
        ...(published !== undefined && { published }),
        ...(content !== undefined || excerpt !== undefined
          ? {
              excerpt: buildExcerpt(nextContent, excerpt),
              readMinutes: readingMinutes(nextContent),
            }
          : {}),
        ...approval,
      },
      include: { author: { select: { name: true } } },
    });

    if (isAuthorEdit && wantsPublish) {
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
      await announceBlog(blog.id);
    }

    return NextResponse.json({
      ...blog,
      pendingApproval: isAuthorEdit && wantsPublish,
    });
  } catch (err) {
    console.error("PUT /api/blogs/[slug] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const existing = await prisma.blog.findUnique({ where: { slug } });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (existing.authorId !== userId && role !== "admin" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.blog.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/blogs/[slug] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
