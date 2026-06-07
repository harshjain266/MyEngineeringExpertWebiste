import type { Metadata } from "next";
import { Star } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Wishlist" };

export default function Page() {
  return <ComingSoon title="Wishlist" icon={<Star size={34} />} />;
}
