import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import BlogEditor from "../../new/blog-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const blog = await prisma.blog.findUnique({ where: { slug } });
  if (!blog || blog.authorId !== user.id) notFound();

  const subjects = await prisma.blog.findMany({
    where: { published: true },
    select: { subject: true },
    distinct: ["subject"],
    orderBy: { subject: "asc" },
  });

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });

  return (
    <BlogEditor
      instructor={instructor}
      subjects={subjects.map((s) => s.subject)}
      initialData={{
        title: blog.title,
        content: blog.content,
        subject: blog.subject,
        tags: blog.tags,
        published: blog.published,
        featuredImage: blog.featuredImage ?? "",
      }}
      slug={slug}
    />
  );
}
