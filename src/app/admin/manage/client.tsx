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
  Building2,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { AdminAccountsTable } from "@/components/admin/admin-accounts-table";
import { AssignTeacher } from "@/components/admin/assign-teacher";
import { BulkAssignBar } from "@/components/admin/bulk-assign-bar";
import { PROGRAMS, PROGRAM_BY_SLUG } from "@/config/programs";
import { cn, formatDate } from "@/lib/utils";
import type { AdminUser, AdminInstructor, AdminCourse, AdminAccount } from "@/types";

type Tab = "users" | "instructors" | "courses" | "admins";

interface Props {
  users: AdminUser[];
  instructors: AdminInstructor[];
  courses: AdminCourse[];
  admins: AdminAccount[];
  isSuperAdmin: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function AdminManageClient({
  users: initialUsers,
  instructors: initialInstructors,
  courses: initialCourses,
  admins: initialAdmins,
  isSuperAdmin,
}: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  const [localUsers, setLocalUsers] = useState(initialUsers);
  const [localInstructors, setLocalInstructors] = useState(initialInstructors);
  const [localCourses, setLocalCourses] = useState(initialCourses);
  const [localAdmins, setLocalAdmins] = useState(initialAdmins);

  const [toggleLoading, setToggleLoading] = useState<Set<string>>(new Set());
  const [promoteLoading, setPromoteLoading] = useState<Set<string>>(new Set());
  const [programLoading, setProgramLoading] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const switchTab = useCallback((next: Tab) => {
    setTab(next);
    setSearch("");
    setProgramFilter("all");
    setSelectedIds(new Set());
  }, []);

  const handleToggle = useCallback(
    async (type: "user" | "instructor" | "course" | "admin", id: string, disabled: boolean) => {
      const key = `${type}-${id}`;
      setToggleLoading((prev) => new Set(prev).add(key));
      console.log(`[Manage] Toggle ${type} ${id} -> disabled=${disabled}`);

      try {
        const res = await fetch("/api/admin/toggle-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id, disabled }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Toggle failed");
        }

        if (type === "user") {
          setLocalUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isDisabled: disabled } : u)));
        } else if (type === "instructor") {
          setLocalInstructors((prev) => prev.map((i) => (i.id === id ? { ...i, isDisabled: disabled } : i)));
        } else if (type === "course") {
          setLocalCourses((prev) => prev.map((c) => (c.id === id ? { ...c, disabled } : c)));
        } else if (type === "admin") {
          setLocalAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, isDisabled: disabled } : a)));
        }
        console.log(`[Manage] Toggle ${type} ${id} -> success`);
      } catch (err) {
        console.error(`[Manage] Toggle ${type} ${id} failed:`, err);
        alert(err instanceof Error ? err.message : "Failed to update status");
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
              adminId: data.instructor.adminId ?? null,
              adminName: data.instructor.adminName ?? null,
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

  const applyAssignment = useCallback(
    async (ids: string[], adminId: string | null) => {
      const res = await fetch("/api/admin/assign-instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorIds: ids, adminId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Assign failed");
      }
      const admin = adminId ? localAdmins.find((a) => a.id === adminId) : undefined;
      const idSet = new Set(ids);
      setLocalInstructors((prev) =>
        prev.map((i) =>
          idSet.has(i.id) ? { ...i, adminId, adminName: admin?.name ?? null } : i,
        ),
      );
    },
    [localAdmins],
  );

  const handleAssign = useCallback(
    async (instructorId: string, adminId: string | null) => {
      try {
        await applyAssignment([instructorId], adminId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to assign teacher");
      }
    },
    [applyAssignment],
  );

  const handleBulkAssign = useCallback(
    async (adminId: string | null) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      try {
        await applyAssignment(ids, adminId);
        setSelectedIds(new Set());
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to assign teachers");
      }
    },
    [applyAssignment, selectedIds],
  );

  const handleUpdateCourseProgram = useCallback(
    async (courseId: string, program: string) => {
      if (!PROGRAM_BY_SLUG[program]) return;
      setProgramLoading((prev) => new Set(prev).add(courseId));
      try {
        const res = await fetch("/api/admin/update-course-program", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, program }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update program");
        }
        setLocalCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, program } : c)),
        );
      } catch (err) {
        console.error("[Manage] Update course program failed:", err);
        alert(err instanceof Error ? err.message : "Failed to update program");
      } finally {
        setProgramLoading((prev) => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
      }
    },
    [],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: "users", label: "Users", icon: Users, count: localUsers.length },
    { key: "instructors", label: "Instructors", icon: GraduationCap, count: localInstructors.length },
    { key: "courses", label: "Courses", icon: BookOpen, count: localCourses.length },
    ...(isSuperAdmin
      ? [{ key: "admins" as Tab, label: "Admins", icon: ShieldCheck, count: localAdmins.length }]
      : []),
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
            onClick={() => switchTab(t.key)}
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
              admins={localAdmins}
              isSuperAdmin={isSuperAdmin}
              onAssign={handleAssign}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onBulkAssign={handleBulkAssign}
              onClearSelection={() => setSelectedIds(new Set())}
            />
          )}
          {tab === "courses" && (
            <CourseTable
              courses={localCourses}
              search={search}
              programFilter={programFilter}
              onProgramFilter={setProgramFilter}
              onToggle={handleToggle}
              onUpdateProgram={handleUpdateCourseProgram}
              toggleLoading={toggleLoading}
              programLoading={programLoading}
            />
          )}
          {tab === "admins" && (
            <AdminAccountsTable
              admins={localAdmins}
              onToggle={(id, disabled) => handleToggle("admin", id, disabled)}
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
  admins,
  isSuperAdmin,
  onAssign,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkAssign,
  onClearSelection,
}: {
  instructors: AdminInstructor[];
  search: string;
  onToggle: (type: "user" | "instructor" | "course" | "admin", id: string, disabled: boolean) => void;
  onDemote: (userId: string, action: "demote") => void;
  toggleLoading: Set<string>;
  promoteLoading: Set<string>;
  admins: AdminAccount[];
  isSuperAdmin: boolean;
  onAssign: (instructorId: string, adminId: string | null) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onBulkAssign: (adminId: string | null) => Promise<void>;
  onClearSelection: () => void;
}) {
  const filtered = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()),
  );

  const isAllSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));

  return (
    <div className="space-y-4">
      {isSuperAdmin && selectedIds.size > 0 && (
        <BulkAssignBar
          count={selectedIds.size}
          admins={admins}
          onApply={onBulkAssign}
          onClear={onClearSelection}
        />
      )}

      <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-surface-muted bg-surface-subtle px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <GraduationCap size={18} className="text-brand-600" />
            Instructors
          </h2>
          {isSuperAdmin && filtered.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-muted">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => onSelectAll(filtered.map((i) => i.id))}
                className="h-4 w-4 accent-brand-600"
              />
              Select all
            </label>
          )}
        </div>
        <motion.div className="divide-y divide-surface-muted" variants={container} initial="hidden" animate="show">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-ink-muted">No instructors found.</div>
          ) : (
            filtered.map((i) => {
              const isToggling = toggleLoading.has(`instructor-${i.id}`);
              const isDemoting = promoteLoading.has(`demote-${i.id}`);
              const isSelected = selectedIds.has(i.id);
              return (
                <motion.div
                  key={i.id}
                  variants={itemAnim}
                  layout
                  className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors ${isSelected ? "bg-brand-50/60" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {isSuperAdmin && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(i.id)}
                        className="h-4 w-4 shrink-0 accent-brand-600"
                      />
                    )}
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
                      {isSuperAdmin && i.adminName && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                          {i.adminName}
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
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-surface-muted bg-surface-subtle px-2 py-1">
                      <Building2 size={12} className="text-ink-muted" />
                      <AssignTeacher
                        instructorId={i.id}
                        currentAdminId={i.adminId}
                        admins={admins}
                        onAssigned={onAssign}
                      />
                    </div>
                  )}
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
    </div>
  );
}

/* ─── Course Table ───────────────────────────────────────────── */

function CourseTable({
  courses,
  search,
  programFilter,
  onProgramFilter,
  onToggle,
  onUpdateProgram,
  toggleLoading,
  programLoading,
}: {
  courses: AdminCourse[];
  search: string;
  programFilter: string;
  onProgramFilter: (program: string) => void;
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
  onUpdateProgram: (courseId: string, program: string) => void;
  toggleLoading: Set<string>;
  programLoading: Set<string>;
}) {
  const filtered = courses.filter(
    (c) =>
      (programFilter === "all" || c.program === programFilter) &&
      (c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.instructorName.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <BookOpen size={18} className="text-brand-600" />
          Courses
        </h2>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
          <span className="shrink-0">Program</span>
          <select
            value={programFilter}
            onChange={(e) => onProgramFilter(e.target.value)}
            className="h-9 rounded-xl border border-surface-muted bg-white px-3 text-sm font-medium text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
          >
            <option value="all">All programs</option>
            {PROGRAMS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <motion.div className="divide-y divide-surface-muted" variants={container} initial="hidden" animate="show">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">No courses found.</div>
        ) : (
          filtered.map((c) => {
            const isToggling = toggleLoading.has(`course-${c.id}`);
            const isUpdatingProgram = programLoading.has(c.id);
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
                  <select
                    value={c.program || "btech-bca"}
                    disabled={isUpdatingProgram}
                    onChange={(e) => onUpdateProgram(c.id, e.target.value)}
                    title="Assign program"
                    className="h-9 rounded-xl border border-surface-muted bg-white px-2.5 text-xs font-semibold text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {isUpdatingProgram ? "Saving…" : PROGRAM_BY_SLUG[c.program]?.name || "No program"}
                    </option>
                    {PROGRAMS.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </select>
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
