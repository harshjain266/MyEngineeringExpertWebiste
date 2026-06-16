"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Video } from "lucide-react";
import type { LiveClass } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function LiveClassPanel({ liveClasses }: { liveClasses: LiveClass[] }) {
  if (!liveClasses || liveClasses.length === 0) {
    return (
      <div className="rounded-none border border-surface-muted bg-white p-4">
        <SectionHeader title="Live Classes" viewAllHref="/dashboard/live-classes" />
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-subtle text-ink-muted">
            <Video size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">No live classes scheduled</p>
          <p className="text-xs text-ink-muted">Check back later for updates</p>
        </div>
      </div>
    );
  }

  const featured = liveClasses.find((c) => c.status === "Live") ?? liveClasses[0];
  const rest = liveClasses.filter((c) => c.id !== featured.id).slice(0, 3);

  return (
    <div className="rounded-none border border-surface-muted bg-white p-4">
      <SectionHeader title="Upcoming Live Class" viewAllHref="/dashboard/live-classes" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-none border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4"
      >
        <div className="flex items-start gap-3">
          <Image
            src={featured.instructor.avatar || "https://i.pravatar.cc/120?img=1"}
            alt={featured.instructor.name}
            width={48}
            height={48}
            className="rounded-none"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {featured.status === "Live" ? (
                <Badge variant="live" className="gap-1 rounded-none">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                </Badge>
              ) : (
                <Badge variant="warning" className="rounded-none">Upcoming</Badge>
              )}
            </div>
            <h3 className="mt-1.5 truncate font-display text-sm font-bold text-ink">
              {featured.title}
            </h3>
            {featured.subject && (
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-brand-600">
                {featured.subject}
              </p>
            )}
            <p className="truncate text-xs text-ink-muted">{featured.topic}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
          <span className="flex items-center gap-1"><CalendarDays size={13} /> {formatDate(featured.startsAt)}</span>
          <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(featured.startsAt)} – {formatTime(featured.endsAt)}</span>
          <span className="flex items-center gap-1"><Users size={13} /> {featured.instructor.name}</span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="flex-1 rounded-none"
            onClick={() => {
              if (featured.meetingUrl) {
                window.open(featured.meetingUrl, "_blank");
              }
            }}
            disabled={!featured.meetingUrl && featured.status === "Live"}
          >
            {featured.status === "Live" ? "Join Now" : "Upcoming"}
          </Button>
          <Button variant="secondary" size="sm" className="flex-1 rounded-none">
            <Video size={15} /> Details
          </Button>
        </div>
      </motion.div>

      <ul className="mt-4 space-y-2.5">
        {rest.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <Image 
              src={c.instructor.avatar || "https://i.pravatar.cc/120?img=1"} 
              alt={c.instructor.name} 
              width={36} 
              height={36} 
              className="rounded-none" 
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{c.title}</div>
              <div className="truncate text-[10px] text-ink-muted">{c.subject ? `${c.subject} · ` : ""}{formatDate(c.startsAt)} · {formatTime(c.startsAt)}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="px-3 rounded-none"
              onClick={() => {
                if (c.meetingUrl) window.open(c.meetingUrl, "_blank");
              }}
              disabled={!c.meetingUrl}
            >
              Join
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
