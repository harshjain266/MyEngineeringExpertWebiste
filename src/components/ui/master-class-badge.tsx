import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Free-master-class badge.
 *
 * The pop-in and the sweeping shine used to be two GSAP tweens, which pulled
 * the whole GSAP runtime (~70 KB) into every bundle that renders a live-class
 * card — the student dashboard and Live Classes pages included. Both effects
 * are plain keyframes, so they are CSS now: no library, no `useEffect`, and no
 * `"use client"` boundary, which lets the badge render on the server.
 */
export function MasterClassBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex animate-badge-pop items-center gap-1.5 overflow-hidden rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-300",
        className,
      )}
    >
      <GraduationCap size={13} className="relative z-10" />
      <span className="relative z-10">Master Class</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 animate-badge-shine bg-emerald-300/50 blur-[2px]"
      />
    </span>
  );
}
