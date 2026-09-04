"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";
import { createCourse } from "@/app/actions/admin";
import { PROGRAMS } from "@/config/programs";
import { cn, formatINR } from "@/lib/utils";
import type { AdminCourse } from "@/types";

interface InstructorOption {
  id: string;
  name: string;
  title: string;
}

interface Props {
  instructors: InstructorOption[];
  courses: AdminCourse[];
}

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const CATEGORIES = [
  "Computer Science",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Information Technology",
];

const inputCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

export function AdminCoursesClient({ instructors, courses }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    instructorId: instructors[0]?.id ?? "",
    program: "btech_bca",
    category: "Computer Science",
    level: "Beginner" as (typeof LEVELS)[number],
    price: "",
    originalPrice: "",
    durationHours: "1",
    lectures: "1",
    language: "English",
    startsOn: "",
    endsOn: "",
    thumbnail: "",
    badge: "",
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!form.instructorId) {
      setError("Please select an instructor first.");
      setSubmitting(false);
      return;
    }

    const res = await createCourse({
      title: form.title,
      instructorId: form.instructorId,
      program: form.program as any,
      category: form.category,
      level: form.level,
      price: Number(form.price) || 0,
      originalPrice: Number(form.originalPrice) || Number(form.price) || 0,
      durationHours: Number(form.durationHours) || 1,
      lectures: Number(form.lectures) || 1,
      language: form.language,
      startsOn: form.startsOn || undefined,
      endsOn: form.endsOn || undefined,
      thumbnail: form.thumbnail || undefined,
      badge: form.badge || undefined,
    });

    setSubmitting(false);
    if (!res.success) {
      setError(res.error || "Something went wrong.");
      return;
    }
    setSuccess(
      res.pendingApproval
        ? `"${res.course?.title}" was sent to the superadmin for approval. Students will see it once it is approved.`
        : `"${res.course?.title}" published — students can now see it.`,
    );
    setForm((prev) => ({
      ...prev,
      title: "",
      price: "",
      originalPrice: "",
      startsOn: "",
      endsOn: "",
      thumbnail: "",
      badge: "",
    }));
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Plus size={28} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Admin Control Center
              </p>
              <h1 className="font-display text-3xl font-bold">Create Course</h1>
              <p className="mt-1 text-sm text-white/80">
                Create a new batch for one of your teachers. It goes to the superadmin for
                approval, then appears to students.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* ─── Create form ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft"
        >
          <div className="flex items-center gap-2 border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <BookOpen size={18} className="text-brand-600" />
            <h2 className="font-display text-lg font-bold text-ink">Course Details</h2>
            <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
              New Batch
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label className={labelCls}>Title *</label>
              <input
                required
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. DSA Foundation — 2026 Batch"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Assign to Teacher *</label>
              <div className="relative">
                <UserRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <select
                  required
                  value={form.instructorId}
                  onChange={set("instructorId")}
                  className={cn(inputCls, "pl-9")}
                >
                  {instructors.length === 0 && <option value="">No teachers assigned</option>}
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              {instructors.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No teachers are assigned to your account yet. Ask the superadmin to assign one.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Program</label>
                <select value={form.program} onChange={set("program")} className={inputCls}>
                  {PROGRAMS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Level</label>
                <select value={form.level} onChange={set("level")} className={inputCls}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={set("category")} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Starts On</label>
                <input type="date" value={form.startsOn} onChange={set("startsOn")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ends On</label>
                <input type="date" value={form.endsOn} onChange={set("endsOn")} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={set("price")}
                  placeholder="1499"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Original Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={set("originalPrice")}
                  placeholder="2999"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Hours</label>
                <input type="number" min={1} value={form.durationHours} onChange={set("durationHours")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Lectures</label>
                <input type="number" min={1} value={form.lectures} onChange={set("lectures")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Language</label>
                <input value={form.language} onChange={set("language")} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Thumbnail URL</label>
              <input
                value={form.thumbnail}
                onChange={set("thumbnail")}
                placeholder="https://… (optional)"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Badge</label>
              <input
                value={form.badge}
                onChange={set("badge")}
                placeholder="e.g. Popular, Flagship (optional)"
                className={inputCls}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting || instructors.length === 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-glow transition-all hover:brightness-105 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {submitting ? "Submitting…" : "Submit for Approval"}
            </button>
          </form>
        </motion.section>

        {/* ─── Existing courses ─── */}
        <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-brand-600" />
              <h2 className="font-display text-lg font-bold text-ink">All Courses</h2>
            </div>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              {courses.length} total
            </span>
          </div>

          <div className="divide-y divide-surface-muted">
            {courses.length === 0 ? (
              <div className="p-12 text-center text-ink-muted">
                No courses published yet. Create your first batch using the form.
              </div>
            ) : (
              courses.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-subtle/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold",
                        c.disabled ? "bg-rose-50 text-rose-400" : "bg-indigo-50 text-indigo-600",
                      )}
                    >
                      {c.title[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">{c.title}</p>
                        {c.disabled && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                            Hidden
                          </span>
                        )}
                        {c.approvalStatus === "pending" && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Awaiting approval
                          </span>
                        )}
                        {c.approvalStatus === "rejected" && (
                          <span
                            title={c.reviewNote ?? undefined}
                            className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600"
                          >
                            Rejected
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <UserRound size={11} /> {c.instructorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap size={11} /> {c.program}
                        </span>
                        <span className="font-semibold text-brand-700">{formatINR(c.price)}</span>
                        <span className="flex items-center gap-1">
                          <Video size={11} /> {c.enrollmentCount} enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      {c.startsOn ? "Starts" : "Created"}
                    </p>
                    <p className="text-xs font-semibold text-ink">
                      {c.startsOn ? formatDatePretty(c.startsOn) : formatDatePretty(c.createdAt)}
                    </p>
                    {c.endsOn && (
                      <p className="text-[11px] text-ink-muted">to {formatDatePretty(c.endsOn)}</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDatePretty(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}