"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  Circle,
  FileStack,
  FileText,
  GraduationCap,
  Radio,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Undo2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  clearReadNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

interface Props {
  items: AppNotification[];
  unread: number;
}

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: LucideIcon; cls: string }
> = {
  master_class: {
    label: "Master class",
    icon: GraduationCap,
    cls: "bg-emerald-50 text-emerald-700",
  },
  live_class: { label: "Live class", icon: Radio, cls: "bg-rose-50 text-rose-600" },
  material: { label: "Study material", icon: FileStack, cls: "bg-brand-50 text-brand-700" },
  blog: { label: "Blog", icon: FileText, cls: "bg-violet-50 text-violet-700" },
  approval: { label: "Approval", icon: ShieldCheck, cls: "bg-amber-50 text-amber-700" },
  decision: { label: "Review", icon: CheckCircle2, cls: "bg-sky-50 text-sky-700" },
  order: { label: "Purchase", icon: ShoppingBag, cls: "bg-indigo-50 text-indigo-700" },
  system: { label: "Update", icon: Bell, cls: "bg-slate-100 text-slate-700" },
};

/** "3m ago" / "2h ago" / "5 Mar" — compact, no dependency. */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationsClient({ items, unread }: Props) {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [type, setType] = useState<NotificationType | "all">("all");
  const [error, setError] = useState("");

  const availableTypes = useMemo(
    () => [...new Set(items.map((n) => n.type))],
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        if (tab === "unread" && n.read) return false;
        if (type !== "all" && n.type !== type) return false;
        return true;
      }),
    [items, tab, type],
  );

  const run = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setError("");
    startTransition(async () => {
      const res = await fn();
      if (!res.success) setError(res.error ?? "Something went wrong.");
    });
  };

  const readCount = items.length - unread;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Bell size={28} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-bold">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Your Activity
              </p>
              <h1 className="font-display text-3xl font-bold">Notifications</h1>
              <p className="mt-1 text-sm text-white/80">
                {unread > 0
                  ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}.`
                  : "You're all caught up."}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-muted bg-surface-subtle px-4 py-3">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold capitalize transition-colors",
                tab === t
                  ? "bg-white text-brand-700 shadow-soft"
                  : "text-ink-muted hover:bg-white/70 hover:text-ink",
              )}
            >
              {t}
              {t === "unread" && unread > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">
                  {unread}
                </span>
              )}
            </button>
          ))}

          {availableTypes.length > 1 && (
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType | "all")}
              aria-label="Filter by type"
              className="h-9 rounded-xl border border-surface-muted bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-brand-300"
            >
              <option value="all">All types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t].label}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => run(markAllNotificationsRead)}
                disabled={pending}
                className="flex items-center gap-1.5 rounded-xl border border-surface-muted bg-white px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            {readCount > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete ${readCount} read notification${readCount === 1 ? "" : "s"}?`,
                    )
                  ) {
                    run(clearReadNotifications);
                  }
                }}
                disabled={pending}
                className="flex items-center gap-1.5 rounded-xl border border-surface-muted bg-white px-3 py-2 text-xs font-bold text-ink-muted transition-colors hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
              >
                <Trash2 size={14} /> Clear read
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <XCircle size={16} /> {error}
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-subtle text-ink-muted">
            <BellOff size={30} />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            {items.length === 0 ? "Nothing here yet" : "Nothing matches that filter"}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
            {items.length === 0
              ? "We'll let you know when a master class is scheduled, your teacher shares new study material, or a new blog goes live."
              : "Try switching back to All."}
          </p>
          {items.length === 0 && (
            <Link href="/dashboard/browse" className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow">
                <BookOpen size={16} /> Explore courses
              </span>
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system;
              const Icon = meta.icon;

              return (
                <motion.li
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={cn(
                    "relative flex gap-4 overflow-hidden rounded-2xl border bg-white p-4 transition-colors sm:p-5",
                    n.read
                      ? "border-surface-muted"
                      : "border-brand-200 bg-brand-50/25 shadow-soft",
                  )}
                >
                  {!n.read && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-brand-gradient" />
                  )}

                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                      meta.cls,
                    )}
                  >
                    <Icon size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {timeAgo(n.createdAt)}
                      </span>
                      {!n.read && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                          <Circle size={7} fill="currentColor" /> New
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 font-display text-base font-bold text-ink">
                      {n.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">{n.body}</p>

                    {n.href && (
                      <Link
                        href={n.href}
                        onClick={() => {
                          // Opening it counts as reading it.
                          if (!n.read) run(() => markNotificationRead(n.id, true));
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
                      >
                        View details →
                      </Link>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      onClick={() => run(() => markNotificationRead(n.id, !n.read))}
                      disabled={pending}
                      title={n.read ? "Mark as unread" : "Mark as read"}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-surface-muted text-ink-muted transition-colors hover:bg-surface-subtle hover:text-brand-700 disabled:opacity-40"
                    >
                      {n.read ? <Undo2 size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                    <button
                      onClick={() => run(() => deleteNotification(n.id))}
                      disabled={pending}
                      title="Delete"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-surface-muted text-ink-muted transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
