import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHeader({
  title,
  viewAllHref,
}: {
  title: string;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          View all <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
