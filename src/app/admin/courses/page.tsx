import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import { getAdminInstructors, getAdminCourses } from "@/lib/data";
import { AdminCoursesClient } from "./courses-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Course",
};

export default async function AdminCoursesPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user)) redirect("/dashboard");

  const [instructors, courses] = await Promise.all([
    getAdminInstructors(user),
    getAdminCourses(),
  ]);

  return (
    <AdminCoursesClient
      instructors={instructors.map((i) => ({ id: i.id, name: i.name, title: i.title }))}
      courses={courses}
    />
  );
}