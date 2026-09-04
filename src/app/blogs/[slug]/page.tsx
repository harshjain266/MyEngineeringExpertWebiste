import Link from "next/link";
import { ArrowRight, Calendar, Clock, Eye, User } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PUBLIC_BLOG_FILTER } from "@/lib/data";
import { buildExcerpt } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({
    where: { slug, ...PUBLIC_BLOG_FILTER },
    select: { title: true, excerpt: true, content: true, featuredImage: true },
  });

  if (!blog) return { title: "Blog" };

  const description = buildExcerpt(blog.content, blog.excerpt, 160);
  return {
    title: blog.title,
    description,
    openGraph: {
      title: blog.title,
      description,
      type: "article",
      ...(blog.featuredImage?.startsWith("http") ? { images: [blog.featuredImage] } : {}),
    },
  };
}

export default async function PublicBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const blog = await prisma.blog.findFirst({
    where: { slug, ...PUBLIC_BLOG_FILTER },
    include: {
      author: { select: { name: true, avatar: true, instructor: { select: { id: true } } } },
    },
  });

  if (!blog) notFound();

  // Best-effort view counter; a failed increment must never 500 the article.
  prisma.blog
    .update({ where: { id: blog.id }, data: { views: { increment: 1 } } })
    .catch((err) => console.error("blog view increment failed:", err));

  const related = await prisma.blog.findMany({
    where: { ...PUBLIC_BLOG_FILTER, subject: blog.subject, id: { not: blog.id } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: { slug: true, title: true, excerpt: true, readMinutes: true },
  });

  const authorInstructorId = blog.author.instructor?.id;

  return (
    <div className="min-h-screen bg-surface-subtle">
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <BackButton href="/blogs" className="mb-6">
          Back to Blogs
        </BackButton>

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
              {blog.readMinutes} min read
            </span>
            {blog.views > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye size={15} />
                {blog.views.toLocaleString("en-IN")} reads
              </span>
            )}
          </div>
          {blog.excerpt && (
            <p className="mt-5 border-l-4 border-brand-500 bg-white/60 py-2 pl-4 text-base leading-7 text-ink-soft">
              {blog.excerpt}
            </p>
          )}
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

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink">Keep reading</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-surface-muted bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
                >
                  <h3 className="line-clamp-2 font-display text-base font-bold text-ink group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{post.excerpt}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
                    {post.readMinutes} min read <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
