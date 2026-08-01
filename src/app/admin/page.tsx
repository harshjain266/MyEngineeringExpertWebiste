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
} from "@/lib/data";
import { AdminClient } from "./admin-client";

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
  ] = await Promise.all([
    getAdminStats(user),
    getAdminMonthlyRevenue(user),
    getAdminUsers(),
    getAdminInstructors(user),
    getAdminCourses(),
    getAdminRecentUsers(),
    getAdminRecentOrders(user),
    isSuperAdmin ? getAdminAccounts() : Promise.resolve([]),
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
    />
  );
}
