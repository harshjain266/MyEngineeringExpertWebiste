"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sidebarNavForRole } from "@/config/nav";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/role-routes";
import type { User } from "@/types";

export function Sidebar({
  user,
  onClose,
  badges,
}: {
  user: User;
  onClose?: () => void;
  /** Live counts keyed by nav href, e.g. `{ "/admin/approvals": 3 }`. */
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const nav = sidebarNavForRole(user.role);
  const isStudent = user.role === "student";

  return (
    <aside className="flex h-full w-72 flex-col border-r border-surface-muted bg-white">
      <div className="flex h-16 items-center justify-between px-5">
        <div>
          <Logo tagline={false} />
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted/70">
            {roleLabel(user.role)} Portal
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X size={20} className="text-ink-soft" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const badge = badges?.[item.href] ?? item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-white"
                  : "text-ink-soft hover:bg-surface-muted hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-brand-gradient shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon
                size={18}
                className={cn("relative z-10 shrink-0", active && "text-white")}
              />
              <span className="relative z-10 flex-1">{item.label}</span>
              {badge ? (
                <Badge
                  variant={active ? "neutral" : "brand"}
                  className={cn("relative z-10", active && "bg-white/20 text-white")}
                >
                  {badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
