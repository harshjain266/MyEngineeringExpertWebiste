"use client";

import { motion } from "framer-motion";
import { Megaphone, Percent, CalendarClock, type LucideIcon } from "lucide-react";
import type { Announcement } from "@/types";
import { SectionHeader } from "@/components/dashboard/section-header";

const TONE: Record<Announcement["tone"], { icon: LucideIcon; ring: string; bg: string }> = {
  info: { icon: Megaphone, ring: "text-brand-600", bg: "bg-brand-50" },
  offer: { icon: Percent, ring: "text-emerald-600", bg: "bg-emerald-50" },
  schedule: { icon: CalendarClock, ring: "text-amber-600", bg: "bg-amber-50" },
};

export function AnnouncementsPanel({ items }: { items: Announcement[] }) {
  return (
    <div className="rounded-2xl border border-surface-muted bg-white p-4">
      <SectionHeader title="Announcements" viewAllHref="/dashboard/notifications" />
      <ul className="space-y-3">
        {items.map((a, i) => {
          const tone = TONE[a.tone];
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-surface-subtle"
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone.bg} ${tone.ring}`}>
                <tone.icon size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink">{a.title}</div>
                <p className="line-clamp-2 text-xs text-ink-muted">{a.body}</p>
                <span className="text-[11px] text-ink-muted">{new Date(a.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
