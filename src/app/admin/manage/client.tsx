"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookOpen,
  Search,
  ShieldCheck,
  UserRound,
  Mail,
  Phone,
  Calendar,
  BookMarked,
  DollarSign,
  BadgeCheck,
  Ban,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "@/lib/utils";
import type { AdminUser, AdminInstructor, AdminCourse } from "@/types";

type Tab = "users" | "instructors" | "courses";

interface Props {
  users: AdminUser[];
  instructors: AdminInstructor[];
  courses: AdminCourse[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function AdminManageClient({ users, instructors, courses }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");

  const handleToggle = useCallback(async (type: "user" | "instructor" | "course", id: string, disabled: boolean) => {
    try {
      const res = await fetch("/api/admin/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, disabled }),
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch {
      alert("Failed to update status");
    }
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: "users", label: "Users", icon: Users, count: users.length },
    { key: "instructors", label: "Instructors", icon: GraduationCap, count: instructors.length },
    { key: "courses", label: "Courses", icon: BookOpen, count: courses.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ─── Hero ─── */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <ShieldCheck size={28} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Admin Control Center
              </p>
              <h1 className="font-display text-3xl font-bold">Manage Platform</h1>
              <p className="mt-1 text-sm text-white/80">
                Enable or disable users, instructors, and courses with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tabs ─── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              tab === t.key
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-white text-ink-muted border border-surface-muted hover:border-brand-200 hover:text-ink",
            )}
          >
            <t.icon size={16} />
            {t.label}
            <span className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
              tab === t.key ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted",
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-2xl border border-surface-muted bg-white pl-10 pr-4 text-sm text-ink placeholder-ink-muted outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      {/* ─── Tab Content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={container}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "users" && (
            <UserTable users={users} search={search} onToggle={handleToggle} />
          )}
          {tab === "instructors" && (
            <InstructorTable instructors={instructors} search={search} onToggle={handleToggle} />
          )}
          {tab === "courses" && (
            <CourseTable courses={courses} search={search} onToggle={handleToggle} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── User Table ─────────────────────────────────────────────── */

function UserTable({
  users,
  search,
  onToggle,
}: {
  users: AdminUser[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
}) {
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Users size={18} className="text-brand-600" />
          Registered Users
        </h2>
      </div>
      <motion.div className="divide-y divide-surface-muted" variants={container} initial="hidden" animate="show">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">No users found.</div>
        ) : (
          filtered.map((u) => (
            <motion.div
              key={u.id}
              variants={item}
              layout
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold",
                  u.isDisabled ? "bg-rose-50 text-rose-400" : "bg-brand-50 text-brand-700",
                )}>
                  {u.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{u.name}</p>
                    {u.isDisabled && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><Mail size={11} /> {u.email}</span>
                    {u.phone && <span className="flex items-center gap-1"><Phone size={11} /> {u.phone}</span>}
                    <span className="flex items-center gap-1"><BookMarked size={11} /> {u.enrollmentCount} enrolled</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(u.createdAt).toISOString().slice(0, 10).replace(/-/g, "/")}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ToggleSwitch
                  checked={!u.isDisabled}
                  onChange={(checked) => onToggle("user", u.id, !checked)}
                />
                <span className="text-xs font-medium text-ink-muted">
                  {u.isDisabled ? "Disabled" : "Active"}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}

/* ─── Instructor Table ───────────────────────────────────────── */

function InstructorTable({
  instructors,
  search,
  onToggle,
}: {
  instructors: AdminInstructor[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
}) {
  const filtered = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <GraduationCap size={18} className="text-brand-600" />
          Instructors
        </h2>
      </div>
      <motion.div className="divide-y divide-surface-muted" variants={container} initial="hidden" animate="show">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">No instructors found.</div>
        ) : (
          filtered.map((i) => (
            <motion.div
              key={i.id}
              variants={item}
              layout
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold",
                  i.isDisabled ? "bg-rose-50 text-rose-400" : "bg-amber-50 text-amber-700",
                )}>
                  {i.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{i.name}</p>
                    {i.isDisabled && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><BadgeCheck size={11} /> {i.title}</span>
                    {i.email && <span className="flex items-center gap-1"><Mail size={11} /> {i.email}</span>}
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {i.courseCount} courses</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ToggleSwitch
                  checked={!i.isDisabled}
                  onChange={(checked) => onToggle("instructor", i.id, !checked)}
                />
                <span className="text-xs font-medium text-ink-muted">
                  {i.isDisabled ? "Disabled" : "Active"}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}

/* ─── Course Table ───────────────────────────────────────────── */

function CourseTable({
  courses,
  search,
  onToggle,
}: {
  courses: AdminCourse[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
}) {
  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructorName.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <BookOpen size={18} className="text-brand-600" />
          Courses
        </h2>
      </div>
      <motion.div className="divide-y divide-surface-muted" variants={container} initial="hidden" animate="show">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">No courses found.</div>
        ) : (
          filtered.map((c) => (
            <motion.div
              key={c.id}
              variants={item}
              layout
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold",
                  c.disabled ? "bg-rose-50 text-rose-400" : "bg-indigo-50 text-indigo-600",
                )}>
                  {c.title[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{c.title}</p>
                    {c.disabled && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><UserRound size={11} /> {c.instructorName}</span>
                    <span className="flex items-center gap-1"><BookMarked size={11} /> {c.category}</span>
                    <span className="flex items-center gap-1"><DollarSign size={11} /> ₹{c.price}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {c.enrollmentCount} enrolled</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ToggleSwitch
                  checked={!c.disabled}
                  onChange={(checked) => onToggle("course", c.id, !checked)}
                />
                <span className="text-xs font-medium text-ink-muted">
                  {c.disabled ? "Hidden" : "Visible"}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
