"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  KeyRound,
  Link2,
  Loader2,
  Radio,
  UserRound,
  Video,
} from "lucide-react";
import { createLiveClass } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { MeetingPasscode } from "@/components/ui/meeting-passcode";
import type { AdminLiveClass } from "@/types";

interface InstructorOption {
  id: string;
  name: string;
  title: string;
}

interface CourseOption {
  id: string;
  title: string;
  instructorName: string;
}

interface Props {
  instructors: InstructorOption[];
  courses: CourseOption[];
  liveClasses: AdminLiveClass[];
}

const inputCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

const statusStyles: Record<string, { label: string; cls: string }> = {
  Live: { label: "Live Now", cls: "bg-rose-50 text-rose-600" },
  Ongoing: { label: "Ongoing", cls: "bg-rose-50 text-rose-600" },
  Completed: { label: "Completed", cls: "bg-surface-muted text-ink-muted" },
  Upcoming: { label: "Upcoming", cls: "bg-amber-50 text-amber-700" },
};

function toDateTimeLocal(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminLiveClassesClient({ instructors, courses, liveClasses }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const courseOptionsFor = useMemo(() => {
    const map = new Map<string, CourseOption[]>();
    for (const c of courses) {
      const list = map.get(c.instructorName) ?? [];
      list.push(c);
      map.set(c.instructorName, list);
    }
    return map;
  }, [courses]);

  const [form, setForm] = useState({
    title: "",
    topic: "",
    subject: "",
    instructorId: instructors[0]?.id ?? "",
    courseId: "",
    startsAt: toDateTimeLocal(60),
    endsAt: toDateTimeLocal(120),
    meetingUrl: "",
    meetingPassword: "",
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const selectedInstructor = instructors.find((i) => i.id === form.instructorId);
  const linkedCourses =
    courseOptionsFor.get(selectedInstructor?.name ?? "") ?? courses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!form.instructorId) {
      setError("Please select a teacher first.");
      setSubmitting(false);
      return;
    }

    const res = await createLiveClass({
      title: form.title,
      topic: form.topic,
      subject: form.subject || undefined,
      instructorId: form.instructorId,
      courseId: form.courseId || undefined,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      meetingUrl: form.meetingUrl || undefined,
      meetingPassword: form.meetingPassword || undefined,
    });

    setSubmitting(false);
    if (!res.success) {
      setError(res.error || "Something went wrong.");
      return;
    }
    setSuccess(
      res.pendingApproval
        ? "Live class sent to the superadmin for approval. It stays hidden from students until it is approved."
        : "Live class scheduled — your teacher can start it from their batch.",
    );
    setForm((prev) => ({
      ...prev,
      title: "",
      topic: "",
      subject: "",
      meetingUrl: "",
      meetingPassword: "",
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
              <Radio size={28} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Admin Control Center
              </p>
              <h1 className="font-display text-3xl font-bold">Create Live Class</h1>
              <p className="mt-1 text-sm text-white/80">
                Schedule a session for one of your teachers. Enrolled students see it right away.
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
            <Video size={18} className="text-brand-600" />
            <h2 className="font-display text-lg font-bold text-ink">Schedule Session</h2>
            <span className="ml-auto rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
              Live
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label className={labelCls}>Class Title *</label>
              <input
                required
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Arrays — Live Doubt Session"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Topic *</label>
              <textarea
                required
                value={form.topic}
                onChange={set("topic")}
                placeholder="What will this session cover?"
                rows={2}
                className="w-full rounded-xl border border-surface-muted bg-white px-3 py-2.5 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Subject</label>
                <input value={form.subject} onChange={set("subject")} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meeting Link</label>
                <div className="relative">
                  <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    value={form.meetingUrl}
                    onChange={set("meetingUrl")}
                    placeholder="https://meet…"
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Meeting Password</label>
              <div className="relative">
                <KeyRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  value={form.meetingPassword}
                  onChange={set("meetingPassword")}
                  placeholder="Passcode students and the teacher will need"
                  className={cn(inputCls, "pl-9")}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">
                Shown next to the join link for the teacher and the enrolled students. Leave
                empty if the link needs no passcode.
              </p>
            </div>

            <div>
              <label className={labelCls}>Teacher *</label>
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
                  No teachers are assigned to your account yet.
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Link to Course</label>
              <select value={form.courseId} onChange={set("courseId")} className={inputCls}>
                <option value="">No course (public master-class)</option>
                {linkedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-muted">
                {selectedInstructor
                  ? `Showing batches taught by ${selectedInstructor.name}.`
                  : "Selecting a course shows the class to its enrolled students."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Starts At *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={set("startsAt")}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Ends At *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={set("endsAt")}
                  className={inputCls}
                />
              </div>
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
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
              {submitting ? "Scheduling…" : "Schedule Live Class"}
            </button>
          </form>
        </motion.section>

        {/* ─── Scheduled classes ─── */}
        <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-brand-600" />
              <h2 className="font-display text-lg font-bold text-ink">Scheduled Classes</h2>
            </div>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              {liveClasses.length} total
            </span>
          </div>

          <div className="divide-y divide-surface-muted">
            {liveClasses.length === 0 ? (
              <div className="p-12 text-center text-ink-muted">
                No sessions scheduled yet. Use the form to plan your first class.
              </div>
            ) : (
              liveClasses.map((lc, i) => (
                <motion.div
                  key={lc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-subtle/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        lc.status === "Live" || lc.status === "Ongoing"
                          ? "bg-rose-50 text-rose-600"
                          : lc.status === "Completed"
                            ? "bg-surface-muted text-ink-muted"
                            : "bg-brand-50 text-brand-700",
                      )}
                    >
                      <Radio size={20} className={lc.status === "Live" ? "animate-pulse" : undefined} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">{lc.title}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusStyles[lc.status]?.cls)}>
                          {statusStyles[lc.status]?.label ?? lc.status}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <UserRound size={11} /> {lc.instructorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 size={11} /> {lc.courseTitle ?? "Public master-class"}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{lc.topic}</p>
                      {lc.meetingPassword && (
                        <MeetingPasscode value={lc.meetingPassword} className="mt-1.5 py-1" />
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      <CalendarDays size={11} /> {formatDay(lc.startsAt)}
                    </p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold text-ink">
                      <Clock size={11} /> {formatTime(lc.startsAt)} – {formatTime(lc.endsAt)}
                    </p>
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

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}