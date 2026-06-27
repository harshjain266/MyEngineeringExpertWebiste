"use client";

import Image from "next/image";
import { CalendarDays, Clock, Radio, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    year: "numeric",
  });
}

export function LiveClassCard({ item, isLive }: { item: any; isLive?: boolean }) {
  const canJoin =
    (item.status === "Live" || item.status === "Ongoing" || isLive) &&
    Boolean(item.meetingUrl);

  return (
    <div className="flex flex-col overflow-hidden rounded-none border border-surface-muted bg-white shadow-soft transition-all hover:shadow-card">
      <div className="relative aspect-video overflow-hidden bg-brand-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <Radio size={48} className={isLive ? "text-rose-500 animate-pulse" : "text-brand-200"} />
        </div>
        <div className="absolute left-3 top-3">
          {canJoin ? (
            <Badge variant="live" className="gap-1 rounded-none">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </Badge>
          ) : (
            <Badge variant="warning" className="rounded-none">Waiting</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-tight text-ink">
          {item.title}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{item.topic}</p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-surface-subtle">
              <CalendarDays size={16} />
            </div>
            <span>{formatDate(item.startsAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-surface-subtle">
              <Clock size={16} />
            </div>
            <span>{formatTime(item.startsAt)} – {formatTime(item.endsAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-none">
              <Image src={item.instructor.avatar} alt={item.instructor.name} fill className="object-cover" />
            </div>
            <span>{item.instructor.name}</span>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Button
            className="w-full rounded-none gap-2"
            onClick={() => {
              if (canJoin && item.meetingUrl) {
                window.open(item.meetingUrl, "_blank");
              }
            }}
            disabled={!canJoin}
          >
            {canJoin ? (
              <>
                <Video size={18} /> Join Now
              </>
            ) : (
              "Teacher has not started"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
