import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import {
  getAdminUsers,
  getAdminInstructors,
  getAdminCourses,
  getAdminAccounts,
  getAdminStats,
  getAdminMonthlyRevenue,
  getAdminRecentOrders,
  getAdminRecentUsers,
  getAdminAllOrders,
} from "@/lib/data";
import { AdminClient } from "./admin-client";

async function getVisitorStats() {
  const counters = await prisma.siteCounter.findMany();
  const counterMap = Object.fromEntries(counters.map((c) => [c.key, c.value]));
  const today = new Date().toISOString().split("T")[0];
  return {
    totalVisits: counterMap["total_visits"] ?? 0,
    uniqueVisitors: counterMap["unique_visitors"] ?? 0,
    todayVisits: counterMap[`daily_${today}`] ?? 0,
  };
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user)) redirect("/dashboard");

  const isSuperAdmin = user.role === "superadmin";

  const [
    stats,
    monthlyRevenue,
    users,
    instructors,
    courses,
    recentUsers,
    recentOrders,
    admins,
    visitorStats,
    allOrders,
  ] = await Promise.all([
    getAdminStats(user),
    getAdminMonthlyRevenue(user),
    getAdminUsers(),
    getAdminInstructors(user),
    getAdminCourses(),
    getAdminRecentUsers(),
    getAdminRecentOrders(user),
    isSuperAdmin ? getAdminAccounts() : Promise.resolve([]),
    getVisitorStats(),
    getAdminAllOrders(user),
  ]);

  return (
    <AdminClient
      stats={stats}
      monthlyRevenue={monthlyRevenue}
      users={users}
      instructors={instructors}
      courses={courses}
      recentUsers={recentUsers}
      recentOrders={recentOrders}
      admins={admins}
      isSuperAdmin={isSuperAdmin}
      visitorStats={visitorStats}
      allOrders={allOrders}
    />
  );
}
