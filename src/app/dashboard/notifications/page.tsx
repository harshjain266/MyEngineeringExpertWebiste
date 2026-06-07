import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <ComingSoon title="Notifications" icon={<Bell size={34} />} />;
}
