import { redirect } from "next/navigation";
import { Users, CreditCard, TrendingUp, ShoppingBag, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  // Security Check: Only admins can see this
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch Stats from Database
  const [totalUsers, totalOrders, recentOrders, recentUsers, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: "Success" } }),
    prisma.order.findMany({
      where: { status: "Success" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.order.aggregate({
      where: { status: "Success" },
      _sum: { amount: true }
    })
  ]);

  const totalRevenue = revenueResult._sum.amount || 0;

  const stats = [
    { label: "Total Students", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Course Sales", value: totalOrders, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Revenue", value: formatINR(totalRevenue), icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Conversion Rate", value: totalUsers > 0 ? `${((totalOrders / totalUsers) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
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
              <h1 className="font-display text-3xl font-bold">Platform Overview</h1>
              <p className="mt-1 text-sm text-white/80">
                Monitor students, sales, orders, and the latest platform activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${s.bg} ${s.color}`}>
                <s.icon size={24} />
              </div>
            <p className="text-sm font-semibold text-ink-muted">{s.label}</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</h3>
            </div>
          ))}
        </div>

      <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Orders */}
        <section id="orders" className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">Recent Sales</h2>
            </div>
          <div className="divide-y divide-surface-muted">
              {recentOrders.length === 0 ? (
              <div className="p-10 text-center text-ink-muted">No sales recorded yet.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 font-bold text-brand-700">
                        {order.user.name[0]}
                      </div>
                      <div>
                      <p className="text-sm font-bold text-ink">{order.course}</p>
                      <p className="text-xs text-ink-muted">{order.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                    <p className="text-sm font-bold text-ink">{formatINR(order.amount)}</p>
                    <p className="flex items-center justify-end gap-1 text-[10px] text-ink-muted">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
        </section>

          {/* New Registrations */}
        <section id="students" className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
          <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">New Registrations</h2>
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
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
        </section>
      </div>
    </div>
  );
}
