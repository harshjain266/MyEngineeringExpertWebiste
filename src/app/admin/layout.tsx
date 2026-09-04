import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import { getPendingApprovalCount, getUnreadNotificationCount } from "@/lib/data";
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

  const [pendingApprovals, unreadCount] = await Promise.all([
    getPendingApprovalCount(user),
    getUnreadNotificationCount(user.id),
  ]);

  return (
    <DashboardShell
      user={user}
      unreadCount={unreadCount}
      badges={pendingApprovals > 0 ? { "/admin/approvals": pendingApprovals } : undefined}
    >
      {children}
    </DashboardShell>
  );
}
