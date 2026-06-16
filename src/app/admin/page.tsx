import { redirect } from "next/navigation";
import { Users, CreditCard, BookOpen, TrendingUp, ShoppingBag, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500 text-sm">Monitor your students, sales, and platform growth.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{s.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="font-bold text-slate-900">Recent Sales</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <div className="p-10 text-center text-slate-500">No sales recorded yet.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {order.user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{order.course}</p>
                        <p className="text-xs text-slate-500">{order.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatINR(order.amount)}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Registrations */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="font-bold text-slate-900">New Registrations</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[10px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
