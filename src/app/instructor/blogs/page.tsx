import Link from "next/link";
import { Plus, Edit3, Eye, Globe, Lock, Clock3, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function InstructorBlogsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const blogs = await prisma.blog.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My Blogs</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Write and manage blog posts for your students. Everything you publish goes to
            your admin for approval before students can read it.
          </p>
        </div>
        <Link href="/instructor/blogs/new">
          <Button>
            <Plus size={16} className="mr-1.5" />
            New Blog
          </Button>
        </Link>
      </section>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-muted bg-surface-subtle px-6 py-20 text-center">
          <Edit3 size={40} className="text-ink-muted/50" />
          <h3 className="mt-4 font-display text-xl font-bold text-ink">No blogs yet</h3>
          <p className="mt-2 max-w-md text-sm text-ink-muted">
            Create your first blog post to share knowledge with your students.
          </p>
          <Link href="/instructor/blogs/new" className="mt-6">
            <Button>Write Your First Blog</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-muted bg-white p-5 shadow-soft"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-lg font-bold text-ink">
                    {blog.title}
                  </h3>
                  {!blog.published ? (
                    <Badge variant="neutral" className="shrink-0">
                      <Lock size={11} className="mr-1" />
                      Draft
                    </Badge>
                  ) : blog.approvalStatus === "approved" ? (
                    <Badge variant="brand" className="shrink-0">
                      <Globe size={11} className="mr-1" />
                      Live
                    </Badge>
                  ) : blog.approvalStatus === "rejected" ? (
                    <Badge variant="danger" className="shrink-0">
                      <XCircle size={11} className="mr-1" />
                      Changes requested
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="shrink-0">
                      <Clock3 size={11} className="mr-1" />
                      Awaiting approval
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-muted">
                  <span>Subject: {blog.subject}</span>
                  <span>{blog.readMinutes} min read</span>
                  {blog.views > 0 && <span>{blog.views.toLocaleString("en-IN")} reads</span>}
                  <span>Updated: {blog.updatedAt.toLocaleDateString("en-IN")}</span>
                </div>
                {blog.reviewNote && blog.approvalStatus === "rejected" && (
                  <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <span className="font-bold">Reviewer note:</span> {blog.reviewNote}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {blog.published && blog.approvalStatus === "approved" && (
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-muted text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                    title="View"
                  >
                    <Eye size={16} />
                  </Link>
                )}
                <Link
                  href={`/instructor/blogs/${blog.slug}/edit`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-muted text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
