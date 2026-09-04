import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard/shell";

/**
 * Notifications are role-agnostic: students, instructors, admins and the
 * superadmin all receive them, so this route sits outside the per-portal
 * layouts (which each redirect anyone of the wrong role away).
 */
export default async function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
