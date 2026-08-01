"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const RichEditor = dynamic(() => import("@/components/editor/rich-editor"), { ssr: false });

const DEFAULT_SUBJECTS = [
  "btech-bca", "dsa", "aptitude", "gate", "web-dev",
  "AI/ML", "Cloud", "DevOps",
];

interface Props {
  instructor: any;
  subjects: string[];
  initialData?: {
    title: string;
    content: string;
    subject: string;
    tags: string[];
    published: boolean;
    featuredImage: string;
  };
  slug?: string;
}

export default function BlogEditor({ instructor, subjects, initialData, slug }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [tagsStr, setTagsStr] = useState(initialData?.tags?.join(", ") ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allSubjects = [...new Set([...DEFAULT_SUBJECTS, ...subjects])];

  async function handleSubmit(publishNow: boolean) {
    if (!title || !content || !subject) {
      setError("Title, content, and subject are required.");
      return;
    }

    setLoading(true);
    setError("");

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = { title, content, subject, tags, published: publishNow };

    try {
      let res;
      if (slug) {
        res = await fetch(`/api/blogs/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/instructor/blogs");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            {slug ? "Edit Blog" : "New Blog"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Write your blog post using the rich editor below.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter blog title..."
            className="w-full rounded-2xl border border-surface-muted bg-white px-4 py-3 text-lg font-bold text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-2xl border border-surface-muted bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Select a subject...</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">
              Tags <span className="text-ink-muted">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. DSA, Arrays, Interviews"
              className="w-full rounded-2xl border border-surface-muted bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-muted bg-white p-1">
        <RichEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}
