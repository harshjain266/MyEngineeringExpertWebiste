import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "My Orders" };

export default function Page() {
  return <ComingSoon title="My Orders" icon={<ShoppingBag size={34} />} />;
}
