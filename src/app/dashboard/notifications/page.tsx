import { redirect } from "next/navigation";

/** Notifications moved to the role-agnostic /notifications route. */
export default function DashboardNotificationsRedirect() {
  redirect("/notifications");
}
