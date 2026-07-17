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
  ArrowUpDown,
  UserMinus,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn, formatDate } from "@/lib/utils";
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

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function AdminManageClient({ users: initialUsers, instructors: initialInstructors, courses: initialCourses }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");

  const [localUsers, setLocalUsers] = useState(initialUsers);
  const [localInstructors, setLocalInstructors] = useState(initialInstructors);
  const [localCourses, setLocalCourses] = useState(initialCourses);

  const [toggleLoading, setToggleLoading] = useState<Set<string>>(new Set());
  const [promoteLoading, setPromoteLoading] = useState<Set<string>>(new Set());

  const handleToggle = useCallback(
    async (type: "user" | "instructor" | "course", id: string, disabled: boolean) => {
      const key = `${type}-${id}`;
      setToggleLoading((prev) => new Set(prev).add(key));
      console.log(`[Manage] Toggle ${type} ${id} -> disabled=${disabled}`);

      try {
        const res = await fetch("/api/admin/toggle-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id, disabled }),
        });

        if (!res.ok) throw new Error("Toggle failed");

        if (type === "user") {
          setLocalUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isDisabled: disabled } : u)));
        } else if (type === "instructor") {
          setLocalInstructors((prev) => prev.map((i) => (i.id === id ? { ...i, isDisabled: disabled } : i)));
        } else if (type === "course") {
          setLocalCourses((prev) => prev.map((c) => (c.id === id ? { ...c, disabled } : c)));
        }
        console.log(`[Manage] Toggle ${type} ${id} -> success`);
      } catch (err) {
        console.error(`[Manage] Toggle ${type} ${id} failed:`, err);
        alert("Failed to update status");
      } finally {
        setToggleLoading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [],
  );

  const handlePromote = useCallback(
    async (userId: string, action: "promote" | "demote") => {
      const key = `${action}-${userId}`;
      setPromoteLoading((prev) => new Set(prev).add(key));
      console.log(`[Manage] ${action} user ${userId}`);

      try {
        const res = await fetch("/api/admin/promote-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `${action} failed`);
        }

        if (action === "promote") {
          const data = await res.json();
          setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
          setLocalInstructors((prev) => [
            {
              id: data.instructor.id,
              userId: data.user.id,
              name: data.user.name,
              title: "Instructor",
              email: data.user.email,
              isDisabled: data.user.isDisabled,
              courseCount: 0,
            },
            ...prev,
          ]);
          console.log(`[Manage] User ${userId} promoted to instructor (optimistic update done)`);
        } else {
          setLocalInstructors((prev) => prev.filter((i) => (i.userId ?? i.id) !== userId));
          const demotedUser = localInstructors.find((i) => (i.userId ?? i.id) === userId);
          if (demotedUser) {
            setLocalUsers((prev) => [
              {
                id: userId,
                name: demotedUser.name,
                email: demotedUser.email,
                phone: "",
                role: "student",
                isDisabled: false,
                createdAt: new Date().toISOString(),
                enrollmentCount: 0,
              } as AdminUser,
              ...prev,
            ]);
          }
          console.log(`[Manage] User ${userId} demoted to student (optimistic update done)`);
        }
      } catch (err) {
        console.error(`[Manage] ${action} user ${userId} failed:`, err);
        alert(err instanceof Error ? err.message : `Failed to ${action} user`);
      } finally {
        setPromoteLoading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [localInstructors, localUsers],
  );

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: "users", label: "Users", icon: Users, count: localUsers.length },
    { key: "instructors", label: "Instructors", icon: GraduationCap, count: localInstructors.length },
    { key: "courses", label: "Courses", icon: BookOpen, count: localCourses.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
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
                Manage users, instructors, courses and their access permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
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

      {/* Search */}
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

      {/* Tab Content */}
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
            <UserTable
              users={localUsers}
              search={search}
              onToggle={handleToggle}
              onPromote={handlePromote}
              toggleLoading={toggleLoading}
              promoteLoading={promoteLoading}
            />
          )}
          {tab === "instructors" && (
            <InstructorTable
              instructors={localInstructors}
              search={search}
              onToggle={handleToggle}
              onDemote={handlePromote}
              toggleLoading={toggleLoading}
              promoteLoading={promoteLoading}
            />
          )}
          {tab === "courses" && (
            <CourseTable
              courses={localCourses}
              search={search}
              onToggle={handleToggle}
              toggleLoading={toggleLoading}
            />
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
  onPromote,
  toggleLoading,
  promoteLoading,
}: {
  users: AdminUser[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
  onPromote: (userId: string, action: "promote") => void;
  toggleLoading: Set<string>;
  promoteLoading: Set<string>;
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
          filtered.map((u) => {
            const isToggling = toggleLoading.has(`user-${u.id}`);
            const isPromoting = promoteLoading.has(`promote-${u.id}`);
            return (
              <motion.div
                key={u.id}
                variants={itemAnim}
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
                      <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => onPromote(u.id, "promote")}
                    disabled={isPromoting}
                    title="Promote to Instructor"
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
                  >
                    {isPromoting ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                    Promote
                  </button>
                  <div className="flex items-center gap-2">
                    {isToggling ? (
                      <div className="h-6 w-11 animate-pulse rounded-full bg-surface-muted" />
                    ) : (
                      <ToggleSwitch
                        checked={!u.isDisabled}
                        onChange={(checked) => onToggle("user", u.id, !checked)}
                      />
                    )}
                    <span className="w-14 text-xs font-medium text-ink-muted">
                      {u.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
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
  onDemote,
  toggleLoading,
  promoteLoading,
}: {
  instructors: AdminInstructor[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
  onDemote: (userId: string, action: "demote") => void;
  toggleLoading: Set<string>;
  promoteLoading: Set<string>;
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
          filtered.map((i) => {
            const isToggling = toggleLoading.has(`instructor-${i.id}`);
            const isDemoting = promoteLoading.has(`demote-${i.id}`);
            return (
              <motion.div
                key={i.id}
                variants={itemAnim}
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
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => onDemote(i.userId ?? i.id, "demote")}
                    disabled={isDemoting}
                    title="Demote to Student"
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
                  >
                    {isDemoting ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                    ) : (
                      <UserMinus size={12} />
                    )}
                    Demote
                  </button>
                  <div className="flex items-center gap-2">
                    {isToggling ? (
                      <div className="h-6 w-11 animate-pulse rounded-full bg-surface-muted" />
                    ) : (
                      <ToggleSwitch
                        checked={!i.isDisabled}
                        onChange={(checked) => onToggle("instructor", i.id, !checked)}
                      />
                    )}
                    <span className="w-14 text-xs font-medium text-ink-muted">
                      {i.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
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
  toggleLoading,
}: {
  courses: AdminCourse[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
  toggleLoading: Set<string>;
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
          filtered.map((c) => {
            const isToggling = toggleLoading.has(`course-${c.id}`);
            return (
              <motion.div
                key={c.id}
                variants={itemAnim}
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
                <div className="flex shrink-0 items-center gap-2">
                  {isToggling ? (
                    <div className="h-6 w-11 animate-pulse rounded-full bg-surface-muted" />
                  ) : (
                    <ToggleSwitch
                      checked={!c.disabled}
                      onChange={(checked) => onToggle("course", c.id, !checked)}
                    />
                  )}
                  <span className="w-14 text-xs font-medium text-ink-muted">
                    {c.disabled ? "Hidden" : "Visible"}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
