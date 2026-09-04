"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Video } from "lucide-react";
import type { LiveClass } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MasterClassBadge } from "@/components/ui/master-class-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { avatarImage } from "@/lib/utils";

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

export function LiveClassPanel({
  liveClasses,
  title = "Upcoming Live Class",
  emptyTitle = "No live classes scheduled",
  viewAllHref = "/dashboard/live-classes",
}: {
  liveClasses: LiveClass[];
  title?: string;
  emptyTitle?: string;
  viewAllHref?: string;
}) {
  if (!liveClasses || liveClasses.length === 0) {
    return (
      <div className="rounded-none border border-surface-muted bg-white p-4">
        <SectionHeader title={title} viewAllHref={viewAllHref} />
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-subtle text-ink-muted">
            <Video size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">{emptyTitle}</p>
          <p className="text-xs text-ink-muted">Check back later for updates</p>
        </div>
      </div>
    );
  }

  const isJoinable = (item: LiveClass) =>
    (item.status === "Live" || item.status === "Ongoing") && Boolean(item.meetingUrl);

  const featured = liveClasses.find((c) => isJoinable(c)) ?? liveClasses[0];
  const rest = liveClasses.filter((c) => c.id !== featured.id).slice(0, 3);
  const featuredJoinable = isJoinable(featured);

  return (
    <div className="rounded-none border border-surface-muted bg-white p-4">
      <SectionHeader title={title} viewAllHref={viewAllHref} />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-none border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4"
      >
        <div className="flex items-start gap-3">
          <Image
            src={avatarImage(featured.instructor.avatar, featured.instructor.name)}
            alt={featured.instructor.name}
            width={48}
            height={48}
            className="rounded-none"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {featured.isMasterClass ? (
                <MasterClassBadge />
              ) : (
                <Badge variant="brand" className="rounded-none">
                  {featured.course?.title ?? "My Batch"}
                </Badge>
              )}
              {featuredJoinable ? (
                <Badge variant="live" className="gap-1 rounded-none">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                </Badge>
              ) : (
                <Badge variant="warning" className="rounded-none">Waiting for teacher</Badge>
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
              if (featuredJoinable && featured.meetingUrl) {
                window.open(featured.meetingUrl, "_blank");
              }
            }}
            disabled={!featuredJoinable}
          >
            {featuredJoinable ? "Join Now" : "Locked"}
          </Button>
          <Link
            href={
              featured.isMasterClass
                ? "/dashboard/live-classes"
                : `/dashboard/my-courses/${featured.course?.slug ?? ""}`
            }
            className="flex-1"
          >
            <Button variant="secondary" size="sm" className="w-full rounded-none">
              <Video size={15} /> Details
            </Button>
          </Link>
        </div>
      </motion.div>

      <ul className="mt-4 space-y-2.5">
        {rest.map((c) => {
          const canJoin = isJoinable(c);

          return (
          <li key={c.id} className="flex items-center gap-3">
            <Image 
              src={avatarImage(c.instructor.avatar, c.instructor.name)} 
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
                if (canJoin && c.meetingUrl) window.open(c.meetingUrl, "_blank");
              }}
              disabled={!canJoin}
            >
              {canJoin ? "Join" : "Locked"}
            </Button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
