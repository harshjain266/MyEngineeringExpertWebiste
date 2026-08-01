import { prisma } from "@/lib/db";
import BlogsPageClient from "./blogs-client";

export const dynamic = "force-dynamic";

export default async function PublicBlogsPage() {
  const subjects = await prisma.blog.findMany({
    where: { published: true },
    select: { subject: true },
    distinct: ["subject"],
    orderBy: { subject: "asc" },
  });

  const blogs = await prisma.blog.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
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
