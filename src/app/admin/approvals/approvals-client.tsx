"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Loader2,
  Pencil,
  Radio,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  reviewBlog,
  reviewCourse,
  reviewLiveClass,
  updateBlogFromReview,
  updateCourseFromReview,
  updateLiveClassFromReview,
} from "@/app/actions/approvals";
import { PROGRAMS } from "@/config/programs";
import { cn, formatINR } from "@/lib/utils";
import type {
  ApprovalStatus,
  PendingBlog,
  PendingCourse,
  PendingLiveClass,
} from "@/types";

type Tab = "courses" | "live-classes" | "blogs";
type Filter = ApprovalStatus | "all";

interface Props {
  canReviewCatalogue: boolean;
  initialTab?: string;
  courses: PendingCourse[];
  liveClasses: PendingLiveClass[];
  blogs: PendingBlog[];
  counts: { courses: number; liveClasses: number; blogs: number };
}

const inputCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const CATEGORIES = [
  "Computer Science",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Information Technology",
];

const STATUS_STYLES: Record<ApprovalStatus, { label: string; cls: string }> = {
  pending: { label: "Awaiting review", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `datetime-local` wants a local wall-clock string, not an ISO UTC one. */
function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso?: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export function ApprovalsClient({
  canReviewCatalogue,
  initialTab,
  courses,
  liveClasses,
  blogs,
  counts,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tabs = useMemo(() => {
    const list: { id: Tab; label: string; icon: typeof BookOpen; count: number }[] = [];
    if (canReviewCatalogue) {
      list.push({ id: "courses", label: "Courses", icon: BookOpen, count: counts.courses });
      list.push({
        id: "live-classes",
        label: "Live Classes",
        icon: Radio,
        count: counts.liveClasses,
      });
    }
    list.push({ id: "blogs", label: "Blogs", icon: FileText, count: counts.blogs });
    return list;
  }, [canReviewCatalogue, counts]);

  const [tab, setTab] = useState<Tab>(() => {
    const requested = initialTab as Tab | undefined;
    return requested && tabs.some((t) => t.id === requested) ? requested : tabs[0].id;
  });
  const [filter, setFilter] = useState<Filter>("pending");
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState<
    | { kind: "course"; row: PendingCourse }
    | { kind: "liveClass"; row: PendingLiveClass }
    | { kind: "blog"; row: PendingBlog }
    | null
  >(null);

  const totalPending = counts.courses + counts.liveClasses + counts.blogs;

  const byFilter = <T extends { approvalStatus: ApprovalStatus }>(rows: T[]) =>
    filter === "all" ? rows : rows.filter((r) => r.approvalStatus === filter);

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, okText: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        setBanner({ tone: "ok", text: okText });
        setEditing(null);
        router.refresh();
      } else {
        setBanner({ tone: "err", text: res.error ?? "Something went wrong." });
      }
    });
  };

  const decide = (
    kind: Tab,
    id: string,
    title: string,
    decision: "approved" | "rejected",
  ) => {
    let note: string | undefined;
    if (decision === "rejected") {
      const reason = window.prompt(
        `Why are you rejecting “${title}”?\nThe author receives this note by email.`,
      );
      if (reason === null) return;
      if (!reason.trim()) {
        setBanner({ tone: "err", text: "A rejection needs a reason." });
        return;
      }
      note = reason;
    }

    const label = decision === "approved" ? "approved" : "rejected";
    if (kind === "courses") {
      run(() => reviewCourse(id, decision, note), `“${title}” ${label}.`);
    } else if (kind === "live-classes") {
      run(() => reviewLiveClass(id, decision, note), `“${title}” ${label}.`);
    } else {
      run(() => reviewBlog(id, decision, note), `“${title}” ${label}.`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <ShieldCheck size={28} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                {canReviewCatalogue ? "Superadmin Review" : "Admin Review"}
              </p>
              <h1 className="font-display text-3xl font-bold">Approvals</h1>
              <p className="mt-1 text-sm text-white/80">
                {canReviewCatalogue
                  ? "Courses and live classes stay hidden from students until you approve them."
                  : "Blogs written by your teachers stay hidden from students until you approve them."}
              </p>
            </div>
            <div className="ml-auto rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
              <p className="font-display text-3xl font-bold">{totalPending}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Awaiting you
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-surface-muted bg-surface-subtle px-4 py-3">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                tab === id
                  ? "bg-white text-brand-700 shadow-soft"
                  : "text-ink-muted hover:bg-white/70 hover:text-ink",
              )}
            >
              <Icon size={16} />
              {label}
              {count > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">
                  {count}
                </span>
              )}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors",
                  filter === f
                    ? "bg-ink text-white"
                    : "text-ink-muted hover:bg-white hover:text-ink",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold",
              banner.tone === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {banner.tone === "ok" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {banner.text}
            <button onClick={() => setBanner(null)} className="ml-auto" aria-label="Dismiss">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists */}
      {tab === "courses" && (
        <QueueList
          rows={byFilter(courses)}
          emptyLabel="No courses in this view."
          render={(c) => (
            <ReviewCard
              key={c.id}
              status={c.approvalStatus}
              title={c.title}
              subtitle={`${c.instructorName} · ${c.category} · ${c.level}`}
              facts={[
                ["Program", c.program],
                ["Price", `${formatINR(c.price)} (was ${formatINR(c.originalPrice)})`],
                ["Duration", `${c.durationHours}h · ${c.lectures} lectures`],
                ["Starts", formatDate(c.startsOn) ?? "Not set"],
                ["Submitted by", c.submittedByName ?? "—"],
              ]}
              note={c.reviewNote}
              reviewer={c.reviewerName}
              busy={pending}
              onApprove={() => decide("courses", c.id, c.title, "approved")}
              onReject={() => decide("courses", c.id, c.title, "rejected")}
              onEdit={() => setEditing({ kind: "course", row: c })}
            />
          )}
        />
      )}

      {tab === "live-classes" && (
        <QueueList
          rows={byFilter(liveClasses)}
          emptyLabel="No live classes in this view."
          render={(lc) => (
            <ReviewCard
              key={lc.id}
              status={lc.approvalStatus}
              title={lc.title}
              subtitle={`${lc.instructorName} · ${lc.topic}`}
              facts={[
                ["Course", lc.courseTitle ?? "Standalone (all students)"],
                ["Subject", lc.subject ?? "—"],
                ["Starts", formatDateTime(lc.startsAt)],
                ["Ends", formatDateTime(lc.endsAt)],
                ["Meeting link", lc.meetingUrl ? "Attached" : "Missing"],
                ["Passcode", lc.meetingPassword ?? "None"],
                ["Submitted by", lc.submittedByName ?? "—"],
              ]}
              note={lc.reviewNote}
              reviewer={lc.reviewerName}
              busy={pending}
              onApprove={() => decide("live-classes", lc.id, lc.title, "approved")}
              onReject={() => decide("live-classes", lc.id, lc.title, "rejected")}
              onEdit={() => setEditing({ kind: "liveClass", row: lc })}
            />
          )}
        />
      )}

      {tab === "blogs" && (
        <QueueList
          rows={byFilter(blogs)}
          emptyLabel="No blogs in this view."
          render={(b) => (
            <ReviewCard
              key={b.id}
              status={b.approvalStatus}
              title={b.title}
              subtitle={`${b.authorName} · ${b.subject}`}
              facts={[
                ["Reading time", `${b.readMinutes} min`],
                ["Tags", b.tags.length ? b.tags.join(", ") : "None"],
                ["Cover image", b.featuredImage ? "Attached" : "Missing"],
                ["Spotlight", b.featured ? "Editor's pick" : "Standard"],
                ["Written", formatDate(b.createdAt) ?? "—"],
              ]}
              excerpt={b.excerpt}
              note={b.reviewNote}
              reviewer={b.reviewerName}
              busy={pending}
              onApprove={() => decide("blogs", b.id, b.title, "approved")}
              onReject={() => decide("blogs", b.id, b.title, "rejected")}
              onEdit={() => setEditing({ kind: "blog", row: b })}
            />
          )}
        />
      )}

      {/* Edit drawer */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
            onClick={() => !pending && setEditing(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="my-8 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-card"
            >
              {editing.kind === "course" && (
                <CourseEditForm
                  row={editing.row}
                  busy={pending}
                  onClose={() => setEditing(null)}
                  onSave={(values) =>
                    run(
                      () => updateCourseFromReview(editing.row.id, values),
                      "Course updated. Approve it when you are happy.",
                    )
                  }
                />
              )}
              {editing.kind === "liveClass" && (
                <LiveClassEditForm
                  row={editing.row}
                  busy={pending}
                  onClose={() => setEditing(null)}
                  onSave={(values) =>
                    run(
                      () => updateLiveClassFromReview(editing.row.id, values),
                      "Live class updated. Approve it when you are happy.",
                    )
                  }
                />
              )}
              {editing.kind === "blog" && (
                <BlogEditForm
                  row={editing.row}
                  busy={pending}
                  onClose={() => setEditing(null)}
                  onSave={(values) =>
                    run(
                      () => updateBlogFromReview(editing.row.id, values),
                      "Blog updated. Approve it when you are happy.",
                    )
                  }
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Shared pieces ─────────────────────────────────────────── */

function QueueList<T>({
  rows,
  emptyLabel,
  render,
}: {
  rows: T[];
  emptyLabel: string;
  render: (row: T) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-subtle text-ink-muted">
          <Inbox size={30} />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-ink">All clear</h3>
        <p className="mt-2 max-w-md text-sm text-ink-muted">{emptyLabel}</p>
      </div>
    );
  }
  return <div className="grid gap-4">{rows.map(render)}</div>;
}

function ReviewCard({
  status,
  title,
  subtitle,
  facts,
  excerpt,
  note,
  reviewer,
  busy,
  onApprove,
  onReject,
  onEdit,
}: {
  status: ApprovalStatus;
  title: string;
  subtitle: string;
  facts: [string, string][];
  excerpt?: string | null;
  note?: string | null;
  reviewer?: string | null;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const badge = STATUS_STYLES[status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1",
                badge.cls,
              )}
            >
              {badge.label}
            </span>
            {reviewer && status !== "pending" && (
              <span className="text-[11px] font-semibold text-ink-muted">
                by {reviewer}
              </span>
            )}
          </div>

          <h3 className="mt-3 font-display text-xl font-bold text-ink">{title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
            <UserRound size={14} /> {subtitle}
          </p>

          {excerpt && (
            <p className="mt-3 line-clamp-3 rounded-xl bg-surface-subtle px-3 py-2 text-sm leading-6 text-ink-soft">
              {excerpt}
            </p>
          )}

          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {label}
                </dt>
                <dd className="truncate text-sm font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {note && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <span className="font-bold">Review note:</span> {note}
            </p>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-44">
          <button
            onClick={onApprove}
            disabled={busy || status === "approved"}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {status === "approved" ? "Approved" : "Approve"}
          </button>
          <button
            onClick={onEdit}
            disabled={busy}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-surface-muted text-sm font-bold text-ink transition-colors hover:bg-surface-subtle disabled:opacity-40"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={onReject}
            disabled={busy || status === "rejected"}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-40"
          >
            <XCircle size={16} /> {status === "rejected" ? "Rejected" : "Reject"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function DrawerHeader({
  icon: Icon,
  title,
  subtitle,
  onClose,
}: {
  icon: typeof BookOpen;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-surface-muted bg-surface-subtle px-6 py-4">
      <Icon size={18} className="text-brand-600" />
      <div className="min-w-0">
        <h2 className="truncate font-display text-lg font-bold text-ink">{title}</h2>
        <p className="truncate text-xs text-ink-muted">{subtitle}</p>
      </div>
      <button onClick={onClose} className="ml-auto text-ink-muted hover:text-ink" aria-label="Close">
        <X size={18} />
      </button>
    </div>
  );
}

function DrawerFooter({ busy, onClose }: { busy: boolean; onClose: () => void }) {
  return (
    <div className="flex justify-end gap-2 border-t border-surface-muted bg-surface-subtle px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="h-11 rounded-xl border border-surface-muted px-5 text-sm font-bold text-ink hover:bg-white"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-bold text-white shadow-glow disabled:opacity-50"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        Save changes
      </button>
    </div>
  );
}

/* ─── Edit forms ────────────────────────────────────────────── */

function CourseEditForm({
  row,
  busy,
  onClose,
  onSave,
}: {
  row: PendingCourse;
  busy: boolean;
  onClose: () => void;
  onSave: (values: Parameters<typeof updateCourseFromReview>[1]) => void;
}) {
  const [form, setForm] = useState({
    title: row.title,
    category: row.category,
    level: row.level,
    program: row.program,
    price: String(row.price),
    originalPrice: String(row.originalPrice),
    durationHours: String(row.durationHours),
    lectures: String(row.lectures),
    language: row.language,
    badge: row.badge ?? "",
    thumbnail: row.thumbnail ?? "",
    startsOn: toDateInput(row.startsOn),
    endsOn: toDateInput(row.endsOn),
  });

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title: form.title,
          category: form.category,
          level: form.level as PendingCourse["level"],
          program: form.program as Parameters<typeof updateCourseFromReview>[1]["program"],
          price: Number(form.price) || 0,
          originalPrice: Number(form.originalPrice) || 0,
          durationHours: Number(form.durationHours) || 1,
          lectures: Number(form.lectures) || 1,
          language: form.language,
          badge: form.badge,
          thumbnail: form.thumbnail,
          startsOn: form.startsOn || undefined,
          endsOn: form.endsOn || undefined,
        });
      }}
    >
      <DrawerHeader
        icon={BookOpen}
        title="Edit before approving"
        subtitle={`${row.instructorName} · submitted by ${row.submittedByName ?? "—"}`}
        onClose={onClose}
      />

      <div className="space-y-4 p-6">
        <div>
          <label className={labelCls}>Title</label>
          <input required value={form.title} onChange={set("title")} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Program</label>
            <select value={form.program} onChange={set("program")} className={inputCls}>
              {PROGRAMS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
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
            <label className={labelCls}>Price (₹)</label>
            <input type="number" min={0} value={form.price} onChange={set("price")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Original Price (₹)</label>
            <input
              type="number"
              min={0}
              value={form.originalPrice}
              onChange={set("originalPrice")}
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

        <div>
          <label className={labelCls}>Thumbnail URL</label>
          <input value={form.thumbnail} onChange={set("thumbnail")} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Badge</label>
          <input value={form.badge} onChange={set("badge")} className={inputCls} />
        </div>
      </div>

      <DrawerFooter busy={busy} onClose={onClose} />
    </form>
  );
}

function LiveClassEditForm({
  row,
  busy,
  onClose,
  onSave,
}: {
  row: PendingLiveClass;
  busy: boolean;
  onClose: () => void;
  onSave: (values: Parameters<typeof updateLiveClassFromReview>[1]) => void;
}) {
  const [form, setForm] = useState({
    title: row.title,
    topic: row.topic,
    subject: row.subject ?? "",
    meetingUrl: row.meetingUrl ?? "",
    meetingPassword: row.meetingPassword ?? "",
    startsAt: toDateTimeLocal(row.startsAt),
    endsAt: toDateTimeLocal(row.endsAt),
  });

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <DrawerHeader
        icon={Radio}
        title="Edit before approving"
        subtitle={`${row.instructorName} · ${row.courseTitle ?? "Standalone"}`}
        onClose={onClose}
      />

      <div className="space-y-4 p-6">
        <div>
          <label className={labelCls}>Title</label>
          <input required value={form.title} onChange={set("title")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Topic</label>
          <input required value={form.topic} onChange={set("topic")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Subject</label>
          <input value={form.subject} onChange={set("subject")} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Starts At</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={set("startsAt")}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Ends At</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={set("endsAt")}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Meeting URL</label>
            <input
              value={form.meetingUrl}
              onChange={set("meetingUrl")}
              placeholder="https://meet.google.com/…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Meeting Password</label>
            <input
              value={form.meetingPassword}
              onChange={set("meetingPassword")}
              placeholder="Passcode (optional)"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <DrawerFooter busy={busy} onClose={onClose} />
    </form>
  );
}

function BlogEditForm({
  row,
  busy,
  onClose,
  onSave,
}: {
  row: PendingBlog;
  busy: boolean;
  onClose: () => void;
  onSave: (values: Parameters<typeof updateBlogFromReview>[1]) => void;
}) {
  const [form, setForm] = useState({
    title: row.title,
    subject: row.subject,
    excerpt: row.excerpt ?? "",
    tags: row.tags.join(", "),
    featuredImage: row.featuredImage ?? "",
    featured: row.featured,
    content: row.content,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title: form.title,
          subject: form.subject,
          excerpt: form.excerpt,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          featuredImage: form.featuredImage,
          featured: form.featured,
          content: form.content,
        });
      }}
    >
      <DrawerHeader
        icon={FileText}
        title="Polish before publishing"
        subtitle={`${row.authorName} · ${row.readMinutes} min read`}
        onClose={onClose}
      />

      <div className="space-y-4 p-6">
        <div>
          <label className={labelCls}>Headline</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Subject</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Teaser shown on cards & search</label>
          <textarea
            rows={3}
            value={form.excerpt}
            onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
            placeholder="One or two lines that make a student want to click…"
            className="w-full rounded-xl border border-surface-muted bg-white p-3 text-sm text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Leave blank to auto-generate from the opening paragraph.
          </p>
        </div>

        <div>
          <label className={labelCls}>Cover image URL</label>
          <input
            value={form.featuredImage}
            onChange={(e) => setForm((p) => ({ ...p, featuredImage: e.target.value }))}
            className={inputCls}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-surface-muted p-3">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
            className="h-4 w-4 accent-brand-600"
          />
          <span className="text-sm font-semibold text-ink">
            Mark as Editor&apos;s pick
            <span className="block text-xs font-normal text-ink-muted">
              Pinned to the top of the blog feed with a highlight badge.
            </span>
          </span>
        </label>

        <div>
          <label className={labelCls}>Content (HTML)</label>
          <textarea
            rows={12}
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            className="w-full rounded-xl border border-surface-muted bg-white p-3 font-mono text-xs leading-5 text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
          />
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
            <Clock size={12} /> Reading time is recalculated automatically on save.
          </p>
        </div>
      </div>

      <DrawerFooter busy={busy} onClose={onClose} />
    </form>
  );
}
