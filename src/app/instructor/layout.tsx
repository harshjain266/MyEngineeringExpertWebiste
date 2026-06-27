import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "instructor") {
    redirect("/");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
