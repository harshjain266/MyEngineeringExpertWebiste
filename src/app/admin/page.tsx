import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers, getAdminInstructors, getAdminCourses } from "@/lib/data";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const [
    totalUsers,
    totalInstructors,
    totalCourses,
    totalOrders,
    revenueResult,
    users,
    instructors,
    courses,
    allOrders,
    recentUsers,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.instructor.count(),
    prisma.course.count(),
    prisma.order.count({ where: { status: "Success" } }),
    prisma.order.aggregate({
      where: { status: "Success" },
      _sum: { amount: true },
    }),
    getAdminUsers(),
    getAdminInstructors(),
    getAdminCourses(),
    prisma.order.findMany({
      where: { status: "Success" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { status: "Success" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true },
    }),
  ]);

  const totalRevenue = revenueResult._sum.amount || 0;

  const monthlyMap: Record<string, number> = {};
  for (const order of allOrders) {
    const key = order.createdAt.toISOString().slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] || 0) + order.amount;
  }
  const monthlyRevenue = Object.entries(monthlyMap)
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-6);

  const stats = { totalUsers, totalInstructors, totalCourses, totalOrders, totalRevenue };

  return (
    <AdminClient
      stats={stats}
      monthlyRevenue={monthlyRevenue}
      users={users}
      instructors={instructors}
      courses={courses}
      recentUsers={recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
      }))}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        course: o.course,
        amount: o.amount,
        createdAt: o.createdAt.toISOString(),
        userName: o.user.name,
        userEmail: o.user.email,
      }))}
    />
  );
}
