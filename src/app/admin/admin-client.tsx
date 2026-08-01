"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, GraduationCap, BookOpen, ClipboardList, Search,
  ShieldCheck, UserRound, Mail, Phone, Calendar, BookMarked,
  DollarSign, BadgeCheck, ShoppingBag, TrendingUp, CreditCard,
  Clock, ArrowUpDown, UserMinus,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Badge } from "@/components/ui/badge";
import { AdminAccountsTable } from "@/components/admin/admin-accounts-table";
import { AssignTeacher } from "@/components/admin/assign-teacher";
import { BulkAssignBar } from "@/components/admin/bulk-assign-bar";
import { cn, formatINR, formatDate } from "@/lib/utils";
import type { AdminUser, AdminInstructor, AdminCourse, AdminAccount } from "@/types";

type Tab = "overview" | "users" | "instructors" | "courses" | "orders" | "admins";

interface Stats {
  totalUsers: number;
  totalInstructors: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  course: string;
  amount: number;
  createdAt: string;
  userName: string;
  userEmail: string | null;
}

interface Props {
  stats: Stats;
  monthlyRevenue: MonthlyRevenue[];
  users: AdminUser[];
  instructors: AdminInstructor[];
  courses: AdminCourse[];
  recentUsers: RecentUser[];
  recentOrders: RecentOrder[];
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

const baseTabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "instructors", label: "Instructors", icon: GraduationCap },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "orders", label: "Orders", icon: ClipboardList },
];

function AdminContent(props: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "overview";

  const [localUsers, setLocalUsers] = useState(props.users);
  const [localInstructors, setLocalInstructors] = useState(props.instructors);
  const [localCourses, setLocalCourses] = useState(props.courses);
  const [localAdmins, setLocalAdmins] = useState(props.admins);
  const [search, setSearch] = useState("");

  const [toggleLoading, setToggleLoading] = useState<Set<string>>(new Set());
  const [promoteLoading, setPromoteLoading] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const tabs = [
    ...baseTabs,
    ...(props.isSuperAdmin
      ? [{ key: "admins" as Tab, label: "Admins", icon: ShieldCheck }]
      : []),
  ];

  const setTab = useCallback(
    (t: Tab) => {
      setSelectedIds(new Set());
      const params = new URLSearchParams(searchParams.toString());
      if (t === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", t);
      }
      const qs = params.toString();
      router.push(qs ? `/admin?${qs}` : "/admin");
    },
    [router, searchParams],
  );

  const handlePromote = useCallback(
    async (userId: string, action: "promote" | "demote") => {
      const key = `${action}-${userId}`;
      setPromoteLoading((prev) => new Set(prev).add(key));
      console.log(`[Admin] ${action} user ${userId}`);

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
          console.log(`[Admin] User ${userId} promoted & moved to instructors (optimistic)`);
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
          console.log(`[Admin] User ${userId} demoted & moved to users (optimistic)`);
        }
      } catch (err) {
        console.error(`[Admin] ${action} user ${userId} failed:`, err);
        alert(err instanceof Error ? err.message : `Failed to ${action} user`);
      } finally {
        setPromoteLoading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [localInstructors],
  );

  const handleToggle = useCallback(
    async (type: "user" | "instructor" | "course" | "admin", id: string, disabled: boolean) => {
      const key = `${type}-${id}`;
      setToggleLoading((prev) => new Set(prev).add(key));

      try {
        const res = await fetch("/api/admin/toggle-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id, disabled }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed");
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
      } catch (err) {
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

  const statCards = [
    {
      label: "Total Students",
      value: props.stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Instructors",
      value: props.stats.totalInstructors.toLocaleString(),
      icon: GraduationCap,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Courses",
      value: props.stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Course Sales",
      value: props.stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Revenue",
      value: formatINR(props.stats.totalRevenue),
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Conversion Rate",
      value:
        props.stats.totalUsers > 0
          ? `${((props.stats.totalOrders / props.stats.totalUsers) * 100).toFixed(1)}%`
          : "0%",
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  function formatMonth(iso: string) {
    const d = new Date(iso + "-01");
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }

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
              <h1 className="font-display text-3xl font-bold">
                {tab === "overview" && "Platform Overview"}
                {tab === "users" && "Manage Users"}
                {tab === "instructors" && "Manage Instructors"}
                {tab === "courses" && "Manage Courses"}
                {tab === "orders" && "Order Management"}
                {tab === "admins" && "Manage Admins"}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {tab === "overview" && "Monitor students, sales, orders, and platform activity."}
                {tab === "users" && "Enable or disable student accounts."}
                {tab === "instructors" && "Manage instructor access and visibility."}
                {tab === "courses" && "Show or hide courses from the platform."}
                {tab === "orders" && "View all successful orders and revenue data."}
                {tab === "admins" && "Enable or disable admin accounts."}
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
          </button>
        ))}
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
          {tab === "overview" && (
            <OverviewTab
              statCards={statCards}
              monthlyRevenue={props.monthlyRevenue}
              recentOrders={props.recentOrders}
              recentUsers={props.recentUsers}
              formatMonth={formatMonth}
              isSuperAdmin={props.isSuperAdmin}
              instructorCount={props.instructors.length}
            />
          )}
          {tab === "users" && (
            <ManageSection
              data={localUsers}
              search={search}
              onSearch={setSearch}
              type="user"
              onToggle={handleToggle}
              toggleLoading={toggleLoading}
              renderMeta={(u: AdminUser) => (
                <>
                  <span className="flex items-center gap-1"><Mail size={11} /> {u.email}</span>
                  {u.phone && <span className="flex items-center gap-1"><Phone size={11} /> {u.phone}</span>}
                  <span className="flex items-center gap-1"><BookMarked size={11} /> {u.enrollmentCount} enrolled</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(u.createdAt)}</span>
                </>
              )}
              filterFn={(u: AdminUser, q: string) =>
                u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
              }
              icon={Users}
              title="Registered Users"
              emptyText="No users found."
              disabledLabel="Disabled"
              activeLabel="Active"
              colorClass={(disabled: boolean) =>
                disabled ? "bg-rose-50 text-rose-400" : "bg-brand-50 text-brand-700"
              }
              extraActions={(u: AdminUser) => {
                const isLoading = promoteLoading.has(`promote-${u.id}`);
                return (
                  <button
                    onClick={() => handlePromote(u.id, "promote")}
                    disabled={isLoading}
                    title="Promote to Instructor"
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                    Promote
                  </button>
                );
              }}
            />
          )}
          {tab === "instructors" && (
            <ManageSection
              data={localInstructors}
              search={search}
              onSearch={setSearch}
              type="instructor"
              onToggle={handleToggle}
              toggleLoading={toggleLoading}
              selectable={props.isSuperAdmin}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              toolbar={
                props.isSuperAdmin && selectedIds.size > 0 ? (
                  <BulkAssignBar
                    count={selectedIds.size}
                    admins={localAdmins}
                    onApply={handleBulkAssign}
                    onClear={() => setSelectedIds(new Set())}
                  />
                ) : undefined
              }
              renderMeta={(i: AdminInstructor) => (
                <>
                  <span className="flex items-center gap-1"><BadgeCheck size={11} /> {i.title}</span>
                  {i.email && <span className="flex items-center gap-1"><Mail size={11} /> {i.email}</span>}
                  <span className="flex items-center gap-1"><BookOpen size={11} /> {i.courseCount} courses</span>
                  {props.isSuperAdmin && i.adminName && (
                    <span className="flex items-center gap-1"><ShieldCheck size={11} /> {i.adminName}</span>
                  )}
                </>
              )}
              filterFn={(i: AdminInstructor, q: string) =>
                i.name.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)
              }
              icon={GraduationCap}
              title="Instructors"
              emptyText="No instructors found."
              disabledLabel="Disabled"
              activeLabel="Active"
              colorClass={(disabled: boolean) =>
                disabled ? "bg-rose-50 text-rose-400" : "bg-amber-50 text-amber-700"
              }
              extraActions={(i: AdminInstructor) => {
                const isLoading = promoteLoading.has(`demote-${i.id}`);
                return (
                  <>
                    {props.isSuperAdmin && (
                      <AssignTeacher
                        instructorId={i.id}
                        currentAdminId={i.adminId}
                        admins={localAdmins}
                        onAssigned={handleAssign}
                      />
                    )}
                    <button
                      onClick={() => handlePromote(i.userId ?? i.id, "demote")}
                      disabled={isLoading}
                      title="Demote to Student"
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                      ) : (
                        <UserMinus size={12} />
                      )}
                      Demote
                    </button>
                  </>
                );
              }}
            />
          )}
          {tab === "courses" && (
            <ManageSection
              data={localCourses}
              search={search}
              onSearch={setSearch}
              type="course"
              onToggle={handleToggle}
              toggleLoading={toggleLoading}
              renderMeta={(c: AdminCourse) => (
                <>
                  <span className="flex items-center gap-1"><UserRound size={11} /> {c.instructorName}</span>
                  <span className="flex items-center gap-1"><BookMarked size={11} /> {c.category}</span>
                  <span className="flex items-center gap-1"><DollarSign size={11} /> ₹{c.price}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {c.enrollmentCount} enrolled</span>
                </>
              )}
              filterFn={(c: AdminCourse, q: string) =>
                c.title.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
              }
              icon={BookOpen}
              title="Courses"
              emptyText="No courses found."
              disabledLabel="Hidden"
              activeLabel="Visible"
              colorClass={(disabled: boolean) =>
                disabled ? "bg-rose-50 text-rose-400" : "bg-indigo-50 text-indigo-600"
              }
            />
          )}
          {tab === "orders" && (
            <OrdersTab recentOrders={props.recentOrders} />
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

export function AdminClient(props: Props) {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-32 animate-pulse rounded-3xl bg-surface-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-3xl bg-surface-muted" />
      </div>
    }>
      <AdminContent {...props} />
    </Suspense>
  );
}

/* ─── Overview Tab ──────────────────────────────────────────── */

function OverviewTab({
  statCards,
  monthlyRevenue,
  recentOrders,
  recentUsers,
  formatMonth,
  isSuperAdmin,
  instructorCount,
}: {
  statCards: { label: string; value: string; icon: any; color: string; bg: string }[];
  monthlyRevenue: MonthlyRevenue[];
  recentOrders: RecentOrder[];
  recentUsers: RecentUser[];
  formatMonth: (iso: string) => string;
  isSuperAdmin: boolean;
  instructorCount: number;
}) {
  const maxRevenue = Math.max(...monthlyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8">
      {/* Empty-state onboarding for admins with no assigned teachers */}
      {!isSuperAdmin && instructorCount === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-ink">No teachers assigned yet</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Your dashboard shows only the teachers assigned to you and their students. Ask the
              superadmin to assign teachers to your account, or promote a student to a teacher —
              that teacher will automatically come under your management.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${s.bg} ${s.color}`}>
              <s.icon size={24} />
            </div>
            <p className="text-sm font-semibold text-ink-muted">{s.label}</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <section className="rounded-3xl border border-surface-muted bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Revenue Trend</h2>
            <span className="text-sm text-ink-muted">Last {monthlyRevenue.length} months</span>
          </div>
          <div className="flex items-end gap-3" style={{ height: 200 }}>
            {monthlyRevenue.map((d, i) => {
              const pct = d.revenue / maxRevenue;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-semibold text-ink">{formatINR(d.revenue)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                    className="w-full max-w-[48px] rounded-t-lg bg-brand-500 hover:bg-brand-600 transition-colors"
                    style={{ minHeight: pct > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-ink-muted whitespace-nowrap">{formatMonth(d.month)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <ShoppingBag size={18} className="text-brand-600" />
              Recent Sales
            </h2>
          </div>
          <div className="divide-y divide-surface-muted">
            {recentOrders.length === 0 ? (
              <div className="p-10 text-center text-ink-muted">No sales recorded yet.</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 font-bold text-brand-700">
                      {order.userName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{order.course}</p>
                      <p className="text-xs text-ink-muted">{order.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{formatINR(order.amount)}</p>
                    <p className="flex items-center justify-end gap-1 text-[10px] text-ink-muted">
                      <Clock size={10} /> {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Users size={18} className="text-brand-600" />
              New Registrations
            </h2>
          </div>
          <div className="divide-y divide-surface-muted">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-600">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{u.name}</p>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                  </div>
                </div>
                <Badge variant="neutral" className="text-[10px]">
                  {formatDate(u.createdAt)}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Course Enrollment Chart */}
      {recentOrders.length > 0 && (
        <CourseEnrollmentChart orders={recentOrders} />
      )}
    </div>
  );
}

function CourseEnrollmentChart({ orders }: { orders: RecentOrder[] }) {
  const courseCounts: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    if (!courseCounts[o.course]) courseCounts[o.course] = { count: 0, revenue: 0 };
    courseCounts[o.course].count += 1;
    courseCounts[o.course].revenue += o.amount;
  }
  const topCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);
  const maxRevenue = Math.max(...topCourses.map(([, v]) => v.revenue), 1);

  return (
    <section className="rounded-3xl border border-surface-muted bg-white p-6 shadow-soft">
      <h2 className="mb-6 font-display text-lg font-bold text-ink">Top Courses by Revenue</h2>
      <div className="space-y-4">
        {topCourses.map(([name, data]) => (
          <div key={name} className="flex items-center gap-4">
            <span className="w-48 shrink-0 truncate text-sm font-medium text-ink">{name}</span>
            <div className="flex-1">
              <div className="h-6 w-full overflow-hidden rounded-full bg-surface-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                />
              </div>
            </div>
            <div className="w-24 text-right">
              <p className="text-sm font-bold text-ink">{formatINR(data.revenue)}</p>
              <p className="text-[10px] text-ink-muted">{data.count} sale{data.count !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Orders Tab ────────────────────────────────────────────── */

function OrdersTab({ recentOrders }: { recentOrders: RecentOrder[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <ClipboardList size={18} className="text-brand-600" />
          All Orders
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-muted bg-surface-subtle/50">
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-muted">Student</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-muted">Course</th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-ink-muted">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-ink-muted">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-muted">
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-ink-muted">No orders found.</td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-subtle/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700">
                        {order.userName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{order.userName}</p>
                        <p className="text-xs text-ink-muted">{order.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{order.course}</td>
                  <td className="px-6 py-4 text-right font-semibold text-ink">{formatINR(order.amount)}</td>
                  <td className="px-6 py-4 text-right text-xs text-ink-muted">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Generic Manage Section ────────────────────────────────── */

function ManageSection<T extends { id: string }>({
  data,
  search,
  onSearch,
  type,
  onToggle,
  toggleLoading,
  renderMeta,
  filterFn,
  icon: Icon,
  title,
  emptyText,
  disabledLabel,
  activeLabel,
  colorClass,
  extraActions,
  selectable,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  toolbar,
}: {
  data: T[];
  search: string;
  onSearch: (s: string) => void;
  type: "user" | "instructor" | "course";
  onToggle: (type: "user" | "instructor" | "course", id: string, disabled: boolean) => void;
  toggleLoading: Set<string>;
  renderMeta: (item: T) => React.ReactNode;
  filterFn: (item: T, query: string) => boolean;
  icon: any;
  title: string;
  emptyText: string;
  disabledLabel: string;
  activeLabel: string;
  colorClass: (disabled: boolean) => string;
  extraActions?: (item: T) => React.ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  toolbar?: React.ReactNode;
}) {
  const isDisabledField = (item: T): boolean =>
    "isDisabled" in item ? (item as any).isDisabled : (item as any).disabled;

  const filtered = data.filter((item) => filterFn(item, search.toLowerCase()));

  const isAllSelected =
    !!selectable &&
    filtered.length > 0 &&
    filtered.every((item) => selectedIds?.has(item.id));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder={`Search ${type}s...`}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="h-11 w-full rounded-2xl border border-surface-muted bg-white pl-10 pr-4 text-sm text-ink placeholder-ink-muted outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      {toolbar}

      <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-surface-muted bg-surface-subtle px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Icon size={18} className="text-brand-600" />
            {title}
          </h2>
          <div className="flex items-center gap-3">
            {selectable && filtered.length > 0 && onSelectAll && (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-muted">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => onSelectAll(filtered.map((item) => item.id))}
                  className="h-4 w-4 accent-brand-600"
                />
                Select all
              </label>
            )}
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              {filtered.length} / {data.length}
            </span>
          </div>
        </div>
        <motion.div className="divide-y divide-surface-muted" variants={container} initial="hidden" animate="show">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-ink-muted">{emptyText}</div>
          ) : (
            filtered.map((entry) => {
              const disabled = isDisabledField(entry);
              const isLoading = toggleLoading.has(`${type}-${entry.id}`);
              const isSelected = !!selectedIds?.has(entry.id);
              return (
                <motion.div
                  key={entry.id}
                  variants={itemAnim}
                  layout
                  className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors ${isSelected ? "bg-brand-50/60" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(entry.id)}
                        className="h-4 w-4 shrink-0 accent-brand-600"
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold",
                        colorClass(disabled),
                      )}
                    >
                      {"name" in entry ? (entry as any).name[0] : (entry as any).title[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">
                          {(entry as any).name || (entry as any).title}
                        </p>
                        {disabled && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                            {disabledLabel}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                        {renderMeta(entry)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {extraActions?.(entry)}
                    <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="h-6 w-11 animate-pulse rounded-full bg-surface-muted" />
                    ) : (
                      <ToggleSwitch
                        checked={!disabled}
                        onChange={(checked) => onToggle(type, entry.id, !checked)}
                      />
                    )}
                      <span className="text-xs font-medium text-ink-muted w-14">
                        {disabled ? disabledLabel : activeLabel}
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
