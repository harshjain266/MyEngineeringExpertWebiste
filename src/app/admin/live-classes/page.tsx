import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import { getAdminInstructors, getAdminCourses, getAdminLiveClasses } from "@/lib/data";
import { AdminLiveClassesClient } from "./live-classes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Live Class",
};

export default async function AdminLiveClassesPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user)) redirect("/dashboard");

  const [instructors, courses, liveClasses] = await Promise.all([
    getAdminInstructors(user),
    getAdminCourses(),
    getAdminLiveClasses(user),
  ]);

  return (
    <AdminLiveClassesClient
      instructors={instructors.map((i) => ({ id: i.id, name: i.name, title: i.title }))}
      courses={courses.map((c) => ({ id: c.id, title: c.title, instructorName: c.instructorName }))}
      liveClasses={liveClasses}
    />
  );
}