"use client";

import { useRef, useState } from "react";
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
  CalendarRange,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { createCourse } from "@/app/actions/admin";
import { PROGRAMS } from "@/config/programs";
import {
  CLASS_DAYS,
  CLASS_DAY_INITIALS,
  cn,
  formatClassDays,
  formatINR,
  formatISTDate,
} from "@/lib/utils";
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

/**
 * A label for a pasted schedule link.
 *
 * The last URL segment is only a usable name when it actually looks like a
 * file. Cloudinary share links end in an opaque id — taking the last segment
 * blindly produced names like "e704ddfb189790c5603fec97633eb2bc".
 */
function scheduleNameFor(url: string, courseTitle: string): string {
  const fallback = courseTitle.trim()
    ? `${courseTitle.trim()} — Class Schedule`
    : "Class Schedule";
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "");
    // Needs a real extension, and a name that is not just a hex blob.
    const named = /\.[a-z0-9]{2,5}$/i.test(last) && !/^[0-9a-f]{16,}\./i.test(last);
    return named ? last : fallback;
  } catch {
    return fallback;
  }
}

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
    status: "paid" as "paid" | "unpaid",
    price: "",
    originalPrice: "",
    durationHours: "1",
    lectures: "1",
    language: "English",
    startsOn: "",
    endsOn: "",
    classStartTime: "",
    classEndTime: "",
    modeOfLectures: "Live Online",
    thumbnail: "",
    badge: "",
  });
  const [classDays, setClassDays] = useState<string[]>([]);
  const [syllabus, setSyllabus] = useState<{ url: string; name: string } | null>(null);
  const [syllabusUploading, setSyllabusUploading] = useState(false);
  const [syllabusError, setSyllabusError] = useState("");
  const syllabusFileRef = useRef<HTMLInputElement>(null);

  const handleSyllabusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSyllabusError("");
    setSyllabusUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "material");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setSyllabusError(data.error ?? "Could not upload that file.");
        return;
      }
      setSyllabus({ url: data.url, name: data.fileName ?? file.name });
    } catch {
      setSyllabusError("Could not upload that file. Please try again.");
    } finally {
      setSyllabusUploading(false);
    }
  };

  const toggleDay = (day: string) =>
    setClassDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

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
      status: form.status,
      price: form.status === "unpaid" ? 0 : Number(form.price) || 0,
      originalPrice: Number(form.originalPrice) || (form.status === "unpaid" ? 0 : Number(form.price)) || 0,
      durationHours: Number(form.durationHours) || 1,
      lectures: Number(form.lectures) || 1,
      language: form.language,
      startsOn: form.startsOn || undefined,
      endsOn: form.endsOn || undefined,
      classDays,
      classStartTime: form.classStartTime || undefined,
      classEndTime: form.classEndTime || undefined,
      modeOfLectures: form.modeOfLectures || undefined,
      syllabusUrl: syllabus?.url || undefined,
      syllabusName: syllabus?.name || undefined,
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
      classStartTime: "",
      classEndTime: "",
      thumbnail: "",
      badge: "",
    }));
    setClassDays([]);
    setSyllabus(null);
    setSyllabusError("");
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

            {/* ─── Batch schedule — drives the "About the Batch" panel ─── */}
            <div className="space-y-4 rounded-2xl border border-surface-muted bg-surface-subtle/60 p-4">
              <div className="flex items-center gap-2">
                <CalendarRange size={16} className="text-brand-600" />
                <h3 className="text-sm font-bold text-ink">Batch Schedule</h3>
                <span className="ml-auto text-[11px] font-semibold text-ink-muted">
                  Shown to students on the course page
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Course Start</label>
                  <input
                    type="date"
                    value={form.startsOn}
                    onChange={set("startsOn")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Course End</label>
                  <input
                    type="date"
                    value={form.endsOn}
                    onChange={set("endsOn")}
                    min={form.startsOn || undefined}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Class Days</label>
                <div className="flex flex-wrap gap-2">
                  {CLASS_DAYS.map((day) => {
                    const active = classDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        aria-pressed={active}
                        title={day}
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-colors",
                          active
                            ? "bg-brand-600 text-white shadow-soft"
                            : "bg-white text-ink-muted ring-1 ring-surface-muted hover:bg-brand-50 hover:text-brand-700",
                        )}
                      >
                        {CLASS_DAY_INITIALS[day]}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  {classDays.length === 0
                    ? "Pick the weekdays this batch runs on."
                    : formatClassDays(classDays)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Class Start Time (IST)</label>
                  <input
                    type="time"
                    value={form.classStartTime}
                    onChange={set("classStartTime")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Class End Time (IST)</label>
                  <input
                    type="time"
                    value={form.classEndTime}
                    onChange={set("classEndTime")}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Mode of Lectures</label>
                <select
                  value={form.modeOfLectures}
                  onChange={set("modeOfLectures")}
                  className={inputCls}
                >
                  <option value="Live Online">Live Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid (Online + Offline)</option>
                  <option value="Recorded">Recorded</option>
                </select>
              </div>

              {/* ─── Import schedule ─── */}
              <div>
                <label className={labelCls}>Import Schedule / Syllabus</label>
                {syllabus ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <FileText size={16} className="shrink-0 text-emerald-700" />
                    <a
                      href={syllabus.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
                    >
                      {syllabus.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => setSyllabus(null)}
                      className="shrink-0 rounded-lg p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
                      aria-label="Remove schedule"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={syllabusFileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                      onChange={handleSyllabusUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => syllabusFileRef.current?.click()}
                      disabled={syllabusUploading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-surface-muted bg-white text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
                    >
                      {syllabusUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Uploading…
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> Upload schedule (PDF, Word, Excel…)
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-surface-muted" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                        or paste a link
                      </span>
                      <span className="h-px flex-1 bg-surface-muted" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://res.cloudinary.com/…/schedule.pdf"
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        setSyllabusError("");
                        if (!url) return;
                        if (!/^https:\/\//i.test(url)) return;
                        setSyllabus({ url, name: scheduleNameFor(url, form.title) });
                      }}
                      className={inputCls}
                    />
                  </div>
                )}
                {syllabusError && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">{syllabusError}</p>
                )}
                <p className="mt-1.5 text-xs text-ink-muted">
                  Students see this in the course Schedule tab, and enrolled students also get it
                  under Study Material → Classes Scheduled. The assigned teacher gets it in their
                  batch.
                </p>
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid — Free Master Course</option>
              </select>
            </div>

            {form.status === "unpaid" ? (
              <div>
                <label className={labelCls}>Course Worth (₹) — optional, shown struck-through</label>
                <input
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={set("originalPrice")}
                  placeholder="2999"
                  className={inputCls}
                />
                <p className="mt-1.5 text-xs text-emerald-700">
                  Free master course — no payment. Any student can enroll for free.
                </p>
              </div>
            ) : (
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
            )}

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
                        {c.status === "unpaid" && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Free
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
                        <span className="font-semibold text-brand-700">
                          {c.status === "unpaid" ? "Free" : formatINR(c.price)}
                        </span>
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

const formatDatePretty = (iso: string) => formatISTDate(iso, { weekday: undefined });