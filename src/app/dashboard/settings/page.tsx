import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Profile Settings" };

export default function Page() {
  return <ComingSoon title="Profile Settings" icon={<Settings size={34} />} />;
}
