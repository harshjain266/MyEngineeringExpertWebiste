"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, User, Filter } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import type { Blog } from "@/types";

const DEFAULT_SUBJECTS = [
  "btech-bca", "dsa", "aptitude", "gate", "web-dev",
  "AI/ML", "Cloud", "DevOps",
];

interface Props {
  blogs: Blog[];
  subjects: string[];
}

export default function BlogsPageClient({ blogs, subjects }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const allSubjects = [...new Set([...DEFAULT_SUBJECTS, ...subjects])];
  const filtered = selectedSubject
    ? blogs.filter((b) => b.subject === selectedSubject)
    : blogs;

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Header */}
      <section className="bg-white border-b border-surface-muted">
        <div className="container-px pt-6">
          <BackButton href="/dashboard">Back</BackButton>
        </div>
        <div className="container-px py-12 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            EngineeringExpert Blogs
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">
            Learn from <span className="gradient-text">Expert Educators</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
            Insights, tutorials, and deep-dives written by your instructors to help you ace your exams.
          </p>
        </div>
      </section>

      <div className="container-px py-10">
        {/* Subject Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink mr-1">
            <Filter size={14} />
            Subject:
          </span>
          <button
            onClick={() => setSelectedSubject(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              !selectedSubject
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-white text-ink-soft border border-surface-muted hover:bg-surface-muted"
            }`}
          >
            All
          </button>
          {allSubjects.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                selectedSubject === s
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "bg-white text-ink-soft border border-surface-muted hover:bg-surface-muted"
              }`}
            >
              {s.replace(/-/g, " ")}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-20 text-center">
            <BookOpen size={40} className="text-ink-muted/50" />
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              No blogs found
            </h3>
            <p className="mt-2 max-w-md text-sm text-ink-muted">
              No blogs available for this subject yet. Check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((blog) => (
              <div
                key={blog.id}
                className="group relative overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
              >
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={blog.title}
                />
                {blog.featuredImage ? (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-brand-50">
                    <BookOpen size={40} className="text-brand-300" />
                  </div>
                )}
                <div className="p-5">
                  <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    {blog.subject.replace(/-/g, " ")}
                  </span>
                  <h3 className="mt-3 line-clamp-2 font-display text-lg font-bold text-ink group-hover:text-brand-700">
                    {blog.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {blog.authorInstructorId ? (
                        <Link
                          href={`/teachers/${blog.authorInstructorId}`}
                          className="relative z-20 font-medium text-brand-700 transition-colors hover:text-brand-800"
                        >
                          {blog.authorName}
                        </Link>
                      ) : (
                        blog.authorName
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
