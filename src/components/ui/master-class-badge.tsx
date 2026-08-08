"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function MasterClassBadge({ className }: { className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const shineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { scale: 0.8, opacity: 0, y: 6 },
        { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(2)" },
      );

      gsap.fromTo(
        shineRef.current,
        { xPercent: -180 },
        {
          xPercent: 240,
          duration: 1.4,
          ease: "power2.inOut",
          repeat: -1,
          repeatDelay: 1.1,
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <span
      ref={rootRef}
      className={cn(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-300",
        className,
      )}
    >
      <GraduationCap size={13} className="relative z-10" />
      <span className="relative z-10">Master Class</span>
      <span
        ref={shineRef}
        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-emerald-300/50 blur-[2px]"
      />
    </span>
  );
}