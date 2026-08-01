import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import {
  getAdminUsers,
  getAdminInstructors,
  getAdminCourses,
  getAdminAccounts,
} from "@/lib/data";
import { AdminManageClient } from "./client";

export default async function AdminManagePage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user)) redirect("/dashboard");

  const isSuperAdmin = user.role === "superadmin";

  console.log("[AdminManagePage] Fetching management data...");

  const [users, instructors, courses, admins] = await Promise.all([
    getAdminUsers(),
    getAdminInstructors(user),
    getAdminCourses(),
    isSuperAdmin ? getAdminAccounts() : Promise.resolve([]),
  ]);

  console.log(
    `[AdminManagePage] Loaded ${users.length} users, ${instructors.length} instructors, ${courses.length} courses${isSuperAdmin ? `, ${admins.length} admins` : ""}`,
  );

  return (
    <AdminManageClient
      users={users}
      instructors={instructors}
      courses={courses}
      admins={admins}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
