import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Help & Support" };

export default function Page() {
  return <ComingSoon title="Help & Support" icon={<HelpCircle size={34} />} />;
}
