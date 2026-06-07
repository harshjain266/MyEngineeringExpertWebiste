import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tagline = true,
  href = "/",
}: {
  className?: string;
  tagline?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient shadow-glow transition-transform group-hover:scale-105">
        <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">
          Engineering<span className="text-brand-600">Expert</span>
        </span>
        {tagline && (
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Your Success, Our Mission
          </span>
        )}
      </span>
    </Link>
  );
}
