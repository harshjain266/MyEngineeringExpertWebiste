import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !canAccessAdmin(user)) {
    redirect("/dashboard");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
