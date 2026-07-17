import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers, getAdminInstructors, getAdminCourses } from "@/lib/data";
import { AdminManageClient } from "./client";

export default async function AdminManagePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  console.log("[AdminManagePage] Fetching management data...");

  const [users, instructors, courses] = await Promise.all([
    getAdminUsers(),
    getAdminInstructors(),
    getAdminCourses(),
  ]);

  console.log(
    `[AdminManagePage] Loaded ${users.length} users, ${instructors.length} instructors, ${courses.length} courses`,
  );

  return <AdminManageClient users={users} instructors={instructors} courses={courses} />;
}
