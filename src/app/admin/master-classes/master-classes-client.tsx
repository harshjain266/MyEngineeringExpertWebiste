"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  GraduationCap,
  Link2,
  Loader2,
  Radio,
  Sparkles,
  Trash2,
  Users,
  UserRound,
} from "lucide-react";
import { cancelMasterClass, createMasterClass } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import type { AdminLiveClass } from "@/types";

interface InstructorOption {
  id: string;
  name: string;
  title: string;
}

interface Props {
  instructors: InstructorOption[];
  masterClasses: AdminLiveClass[];
  /** Superadmins publish straight away; an admin's class waits for review. */
  autoApproved: boolean;
}

type Filter = "all" | "upcoming" | "live" | "completed" | "pending";

const inputCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

function toDateTimeLocal(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isLive(mc: AdminLiveClass) {
  return mc.status === "Live" || mc.status === "Ongoing";
}

export function AdminMasterClassesClient({ instructors, masterClasses, autoApproved }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    topic: "",
    subject: "",
    instructorId: instructors[0]?.id ?? "",
    startsAt: toDateTimeLocal(60),
    endsAt: toDateTimeLocal(120),
    meetingUrl: "",
  });

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: masterClasses.length,
      live: masterClasses.filter(isLive).length,
      upcoming: masterClasses.filter(
        (mc) => !isLive(mc) && mc.status !== "Completed" && new Date(mc.startsAt).getTime() > now,
      ).length,
      pending: masterClasses.filter((mc) => mc.approvalStatus === "pending").length,
    };
  }, [masterClasses]);

  const visible = useMemo(() => {
    const now = Date.now();
    switch (filter) {
      case "live":
        return masterClasses.filter(isLive);
      case "upcoming":
        return masterClasses.filter(
          (mc) => !isLive(mc) && mc.status !== "Completed" && new Date(mc.startsAt).getTime() > now,
        );
      case "completed":
        return masterClasses.filter((mc) => mc.status === "Completed");
      case "pending":
        return masterClasses.filter((mc) => mc.approvalStatus === "pending");
      default:
        return masterClasses;
    }
  }, [filter, masterClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.instructorId) {
      setError("Please select a teacher to host this master class.");
      return;
    }

    setSubmitting(true);
    const res = await createMasterClass({
      title: form.title,
      topic: form.topic,
      subject: form.subject || undefined,
      instructorId: form.instructorId,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      meetingUrl: form.meetingUrl || undefined,
    });
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || "Could not schedule the master class. Please try again.");
      return;
    }

    setSuccess(
      res.pendingApproval
        ? "Master class sent to the superadmin for approval. Students see it once it's approved."
        : "Master class scheduled — every student has been notified.",
    );
    setForm((prev) => ({ ...prev, title: "", topic: "", subject: "", meetingUrl: "" }));
    router.refresh();
  };

  const handleCancel = async (mc: AdminLiveClass) => {
    if (!window.confirm(`Cancel "${mc.title}"? Students will no longer see this master class.`)) {
      return;
    }
    setError("");
    setSuccess("");
    setCancellingId(mc.id);
    const res = await cancelMasterClass(mc.id);
    setCancellingId(null);
    if (!res.success) {
      setError(res.error || "Could not cancel the master class.");
      return;
    }
    setSuccess(`"${mc.title}" was cancelled.`);
    router.refresh();
  };

  const handleCopy = async (mc: AdminLiveClass) => {
    if (!mc.meetingUrl) return;
    await navigator.clipboard.writeText(mc.meetingUrl);
    setCopiedId(mc.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <GraduationCap size={28} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Admin Control Center
              </p>
              <h1 className="font-display text-3xl font-bold">Master Classes</h1>
              <p className="mt-1 text-sm text-white/80">
                Free sessions open to every student — no course purchase, no batch enrolment.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-surface-muted border-t border-surface-muted sm:grid-cols-4 sm:divide-x">
          <Stat label="Scheduled" value={stats.total} icon={<Sparkles size={15} />} />
          <Stat label="Live now" value={stats.live} icon={<Radio size={15} />} tone="rose" />
          <Stat label="Upcoming" value={stats.upcoming} icon={<CalendarDays size={15} />} />
          <Stat
            label="Awaiting approval"
            value={stats.pending}
            icon={<Clock size={15} />}
            tone="amber"
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* ─── Schedule form ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft"
        >
          <div className="flex items-center gap-2 border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <GraduationCap size={18} className="text-brand-600" />
            <h2 className="font-display text-lg font-bold text-ink">Schedule Master Class</h2>
            <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              Free
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div className="flex gap-2.5 rounded-xl bg-brand-50/70 px-4 py-3 text-xs text-brand-800">
              <Users size={15} className="mt-0.5 shrink-0" />
              <span>
                Master classes reach <strong>every student</strong> on the platform, and each one
                gets a notification the moment it goes live
                {autoApproved ? "." : " — once the superadmin approves it."}
              </span>
            </div>

            <div>
              <label className={labelCls}>Class Title *</label>
              <input
                required
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Cracking Placement Aptitude in 90 Minutes"
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
                <input
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="Optional"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Meeting Link</label>
                <div className="relative">
                  <Link2
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
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
              <label className={labelCls}>Host Teacher *</label>
              <div className="relative">
                <UserRound
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <select
                  required
                  value={form.instructorId}
                  onChange={set("instructorId")}
                  className={cn(inputCls, "pl-9")}
                >
                  {instructors.length === 0 && <option value="">No teachers assigned</option>}
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {i.title}
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
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <GraduationCap size={18} />
              )}
              {submitting ? "Scheduling…" : "Schedule Master Class"}
            </button>
          </form>
        </motion.section>

        {/* ─── Scheduled master classes ─── */}
        <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" />
              <h2 className="font-display text-lg font-bold text-ink">Scheduled Master Classes</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "All"],
                  ["upcoming", "Upcoming"],
                  ["live", "Live"],
                  ["completed", "Completed"],
                  ["pending", "Pending"],
                ] as [Filter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    filter === key
                      ? "bg-brand-600 text-white"
                      : "bg-surface-muted text-ink-muted hover:bg-brand-50 hover:text-brand-700",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-surface-muted">
            {visible.length === 0 ? (
              <div className="p-12 text-center text-ink-muted">
                {masterClasses.length === 0
                  ? "No master classes yet. Use the form to schedule your first free session."
                  : "No master classes match this filter."}
              </div>
            ) : (
              visible.map((mc, i) => (
                <motion.div
                  key={mc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-subtle/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        isLive(mc)
                          ? "bg-rose-50 text-rose-600"
                          : mc.status === "Completed"
                            ? "bg-surface-muted text-ink-muted"
                            : "bg-brand-50 text-brand-700",
                      )}
                    >
                      <GraduationCap size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">{mc.title}</p>
                        <StatusPill mc={mc} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <UserRound size={11} /> {mc.instructorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} /> Open to all students
                        </span>
                        {mc.subject && <span>{mc.subject}</span>}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{mc.topic}</p>
                      {mc.approvalStatus === "rejected" && mc.reviewNote && (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          Rejected: {mc.reviewNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        <CalendarDays size={11} /> {formatDay(mc.startsAt)}
                      </p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold text-ink">
                        <Clock size={11} /> {formatTime(mc.startsAt)} – {formatTime(mc.endsAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {mc.meetingUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopy(mc)}
                          title="Copy meeting link"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-surface-muted text-ink-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {copiedId === mc.id ? (
                            <CheckCircle2 size={15} className="text-emerald-600" />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      )}
                      {mc.status !== "Completed" && (
                        <button
                          type="button"
                          onClick={() => handleCancel(mc)}
                          disabled={cancellingId === mc.id}
                          title="Cancel master class"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-surface-muted text-ink-muted transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          {cancellingId === mc.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      )}
                    </div>
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

function Stat({
  label,
  value,
  icon,
  tone = "brand",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "brand" | "rose" | "amber";
}) {
  const toneCls =
    tone === "rose"
      ? "bg-rose-50 text-rose-600"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-brand-50 text-brand-700";
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <span className={cn("grid h-8 w-8 place-items-center rounded-xl", toneCls)}>{icon}</span>
      <div>
        <p className="font-display text-xl font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatusPill({ mc }: { mc: AdminLiveClass }) {
  if (mc.approvalStatus === "pending") {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        Awaiting approval
      </span>
    );
  }
  if (mc.approvalStatus === "rejected") {
    return (
      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
        Rejected
      </span>
    );
  }
  if (isLive(mc)) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
        <Radio size={9} className="animate-pulse" /> Live now
      </span>
    );
  }
  if (mc.status === "Completed") {
    return (
      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
        Completed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      Upcoming
    </span>
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
