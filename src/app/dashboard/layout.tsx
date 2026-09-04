import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/data";
import { portalHrefForRole } from "@/lib/role-routes";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect(portalHrefForRole(user.role));
  
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <DashboardShell
      user={user}
      unreadCount={unreadCount}
      badges={unreadCount > 0 ? { "/notifications": unreadCount } : undefined}
    >
      {children}
    </DashboardShell>
  );
}
