import { prisma } from "@/lib/db";
import { PUBLIC_BLOG_FILTER } from "@/lib/data";
import BlogsPageClient from "./blogs-client";

export const dynamic = "force-dynamic";

export default async function PublicBlogsPage() {
  const subjects = await prisma.blog.findMany({
    where: PUBLIC_BLOG_FILTER,
    select: { subject: true },
    distinct: ["subject"],
    orderBy: { subject: "asc" },
  });

  const blogs = await prisma.blog.findMany({
    where: PUBLIC_BLOG_FILTER,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, avatar: true, instructor: { select: { id: true } } } },
    },
  });

  const serialized = blogs.map((b) => ({
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
  }));

  return (
    <BlogsPageClient
      blogs={serialized}
      subjects={subjects.map((s) => s.subject)}
    />
  );
}
