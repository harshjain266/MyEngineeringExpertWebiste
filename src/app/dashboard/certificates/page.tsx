import type { Metadata } from "next";
import { Award } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "My Certificates" };

export default function Page() {
  return <ComingSoon title="My Certificates" icon={<Award size={34} />} />;
}
