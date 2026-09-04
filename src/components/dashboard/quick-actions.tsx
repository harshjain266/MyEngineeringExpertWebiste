"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookMarked,
  FileText,
  MessageCircleQuestion,
  Radio,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Action {
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
  /** Not built yet — rendered disabled instead of as a dead `#` link. */
  soon?: boolean;
}

const ACTIONS: Action[] = [
  { label: "Browse Courses", icon: BookMarked, href: "/dashboard/browse", color: "bg-violet-50 text-violet-600" },
  { label: "Live Classes", icon: Radio, href: "/dashboard/live-classes", color: "bg-rose-50 text-rose-600" },
  { label: "Study Material", icon: StickyNote, href: "/dashboard/materials", color: "bg-emerald-50 text-emerald-600" },
  { label: "Doubt Support", icon: MessageCircleQuestion, href: "/dashboard/help", color: "bg-sky-50 text-sky-600" },
  { label: "Test Series", icon: FileText, href: "#", color: "bg-amber-50 text-amber-600", soon: true },
  { label: "Community", icon: Users, href: "#", color: "bg-indigo-50 text-indigo-600", soon: true },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {ACTIONS.map((a, i) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          {a.soon ? (
            <div
              aria-disabled
              title="Coming soon"
              className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-dashed border-surface-muted bg-surface-subtle/60 p-3 text-center opacity-70"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${a.color}`}>
                <a.icon size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-ink-muted">
                {a.label}
                <span className="block text-[9px] font-bold uppercase tracking-wider">
                  Soon
                </span>
              </span>
            </div>
          ) : (
            <Link
              href={a.href}
              className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-surface-muted bg-white p-3 text-center transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${a.color} transition-transform group-hover:scale-110`}>
                <a.icon size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-ink-soft">{a.label}</span>
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
}
