import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/data";
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
