"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingPasscode } from "@/components/ui/meeting-passcode";
import type { LiveClass } from "@/types";

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

/**
 * Dashboard notification for free master classes — the one live-class track
 * every student can attend, whether or not they have bought anything.
 */
export function MasterClassAlert({ classes }: { classes: LiveClass[] }) {
  if (!classes || classes.length === 0) return null;

  const liveNow = classes.find(
    (c) => (c.status === "Live" || c.status === "Ongoing") && Boolean(c.meetingUrl),
  );
  const next = liveNow ?? classes[0];
  const more = classes.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        liveNow
          ? "overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white"
          : "overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"
      }
      role="status"
    >
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <span
          className={
            liveNow
              ? "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500 text-white"
              : "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white"
          }
        >
          {liveNow ? <Radio size={22} className="animate-pulse" /> : <Sparkles size={22} />}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={
              liveNow
                ? "text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600"
                : "text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700"
            }
          >
            {liveNow ? "Master class live now" : "Free master class"} · open to everyone
          </p>
          <h3 className="mt-1 truncate font-display text-base font-bold text-ink">
            {next.title}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <CalendarClock size={12} /> {when(next.startsAt)}
            </span>
            <span>{next.instructor.name}</span>
            {more > 0 && (
              <span className="font-semibold text-ink-soft">
                +{more} more this week
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {next.meetingPassword ? (
            <MeetingPasscode value={next.meetingPassword} className="py-1" />
          ) : null}
          {liveNow && liveNow.meetingUrl ? (
            <a href={liveNow.meetingUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 rounded-none bg-rose-600 hover:bg-rose-700">
                Join now <ArrowRight size={14} />
              </Button>
            </a>
          ) : (
            <Link href="/dashboard/live-classes">
              <Button size="sm" variant="secondary" className="gap-1.5 rounded-none">
                View schedule <ArrowRight size={14} />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
