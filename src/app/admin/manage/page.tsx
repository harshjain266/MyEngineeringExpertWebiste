import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers, getAdminInstructors, getAdminCourses } from "@/lib/data";
import { AdminManageClient } from "./client";

export default async function AdminManagePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const [users, instructors, courses] = await Promise.all([
    getAdminUsers(),
    getAdminInstructors(),
    getAdminCourses(),
  ]);

  return <AdminManageClient users={users} instructors={instructors} courses={courses} />;
}
