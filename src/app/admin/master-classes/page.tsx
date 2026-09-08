import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin, isSuperAdmin } from "@/lib/roles";
import { getAdminInstructors, getAdminMasterClasses } from "@/lib/data";
import { AdminMasterClassesClient } from "./master-classes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Classes",
};

export default async function AdminMasterClassesPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user)) redirect("/dashboard");

  const [instructors, masterClasses] = await Promise.all([
    getAdminInstructors(user),
    getAdminMasterClasses(user),
  ]);

  return (
    <AdminMasterClassesClient
      instructors={instructors.map((i) => ({ id: i.id, name: i.name, title: i.title }))}
      masterClasses={masterClasses}
      autoApproved={isSuperAdmin(user)}
    />
  );
}
