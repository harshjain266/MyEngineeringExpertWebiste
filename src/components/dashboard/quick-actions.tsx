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

const ACTIONS: { label: string; icon: LucideIcon; href: string; color: string }[] = [
  { label: "Browse Courses", icon: BookMarked, href: "/dashboard/browse", color: "bg-violet-50 text-violet-600" },
  { label: "Live Classes", icon: Radio, href: "/dashboard/live-classes", color: "bg-rose-50 text-rose-600" },
  { label: "Test Series", icon: FileText, href: "#", color: "bg-amber-50 text-amber-600" },
  { label: "Notes & PDFs", icon: StickyNote, href: "#", color: "bg-emerald-50 text-emerald-600" },
  { label: "Doubt Support", icon: MessageCircleQuestion, href: "#", color: "bg-sky-50 text-sky-600" },
  { label: "Community", icon: Users, href: "#", color: "bg-indigo-50 text-indigo-600" },
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
          <Link
            href={a.href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-surface-muted bg-white p-3 text-center transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
          >
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${a.color} transition-transform group-hover:scale-110`}>
              <a.icon size={20} />
            </span>
            <span className="text-[11px] font-medium leading-tight text-ink-soft">{a.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
