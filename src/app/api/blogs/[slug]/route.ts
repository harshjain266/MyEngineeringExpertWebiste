import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    if (existing.authorId !== userId && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, subject, featuredImage, tags, published } = await req.json();

    const blog = await prisma.blog.update({
      where: { slug },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(subject !== undefined && { subject }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(tags !== undefined && { tags }),
        ...(published !== undefined && { published }),
      },
    });

    return NextResponse.json(blog);
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
    if (existing.authorId !== userId && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.blog.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/blogs/[slug] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
