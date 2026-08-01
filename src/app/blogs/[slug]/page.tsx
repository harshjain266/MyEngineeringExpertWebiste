import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PublicBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const blog = await prisma.blog.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { name: true, avatar: true, instructor: { select: { id: true } } } },
    },
  });

  if (!blog) notFound();

  const authorInstructorId = blog.author.instructor?.id;

  return (
    <div className="min-h-screen bg-surface-subtle">
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link
          href="/blogs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to Blogs
        </Link>

        <header className="mb-8">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            {blog.subject.replace(/-/g, " ")}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            {blog.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
            {authorInstructorId ? (
              <Link
                href={`/teachers/${authorInstructorId}`}
                className="flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800"
              >
                <User size={15} />
                {blog.author.name}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5">
                <User size={15} />
                {blog.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={15} />
              {blog.createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              {getReadingTime(blog.content)} min read
            </span>
          </div>
          {blog.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {blog.tags.map((tag: string) => (
                <Badge key={tag} variant="neutral">{tag}</Badge>
              ))}
            </div>
          )}
        </header>

        {blog.featuredImage && (
          <div className="mb-8 overflow-hidden rounded-3xl">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow-soft sm:p-10">
          <div
            className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-ink-muted prose-a:text-brand-700 prose-img:rounded-2xl prose-blockquote:border-brand-500 prose-blockquote:bg-brand-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-xl prose-code:bg-surface-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </article>
    </div>
  );
}

function getReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
