import Link from "next/link";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  GraduationCap,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getInstructorMasterClasses } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StartClassButton } from "@/components/instructor/start-class-button";
import { MeetingPasscode } from "@/components/ui/meeting-passcode";
import type { InstructorMasterClass } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Master Classes",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const isLive = (mc: InstructorMasterClass) => mc.status === "Live" || mc.status === "Ongoing";

export default async function InstructorMasterClassesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const masterClasses = await getInstructorMasterClasses(user.id);
  const now = Date.now();

  const upcoming = masterClasses.filter(
    (mc) => mc.status !== "Completed" && new Date(mc.endsAt).getTime() >= now,
  );
  const past = masterClasses
    .filter((mc) => !upcoming.includes(mc))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <GraduationCap size={25} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Teaching Workspace
              </p>
              <h1 className="font-display text-3xl font-bold">My Master Classes</h1>
              <p className="mt-1 text-sm text-white/80">
                Free sessions an admin scheduled for you. Every student on the platform can
                attend — start the class here and they join with the same link.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Scheduled" value={masterClasses.length} icon={<Sparkles size={21} />} />
        <SummaryCard label="Upcoming" value={upcoming.length} icon={<CalendarDays size={21} />} />
        <SummaryCard
          label="Live now"
          value={masterClasses.filter(isLive).length}
          icon={<Radio size={21} />}
        />
      </div>

      {masterClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <GraduationCap size={30} />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            No master classes scheduled
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
            When an admin schedules a free master class with you as the host, it shows up here
            with its join link and passcode.
          </p>
          <Link href="/instructor/batches" className="mt-6">
            <Button variant="secondary">View My Batches</Button>
          </Link>
        </div>
      ) : (
        <>
          <ClassList
            title="Upcoming & live"
            classes={upcoming}
            empty="No upcoming master classes right now."
          />
          {past.length > 0 && (
            <ClassList title="Past sessions" classes={past} empty="" muted />
          )}
        </>
      )}
    </div>
  );
}

function ClassList({
  title,
  classes,
  empty,
  muted,
}: {
  title: string;
  classes: InstructorMasterClass[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
          {classes.length}
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-surface-muted bg-white py-10 text-center text-sm text-ink-muted">
          {empty}
        </div>
      ) : (
        <div className="grid gap-4">
          {classes.map((mc) => {
            const live = isLive(mc);
            const completed = mc.status === "Completed";
            const approved = mc.approvalStatus === "approved";

            return (
              <article
                key={mc.id}
                className={`flex flex-col gap-5 rounded-3xl border bg-white p-5 shadow-soft transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  live ? "border-rose-200" : "border-surface-muted"
                } ${muted ? "opacity-80" : ""}`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      live
                        ? "bg-rose-50 text-rose-600"
                        : completed
                          ? "bg-surface-muted text-ink-muted"
                          : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    <GraduationCap size={22} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {live ? (
                        <Badge variant="live" className="gap-1">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                          NOW
                        </Badge>
                      ) : completed ? (
                        <Badge variant="neutral">Completed</Badge>
                      ) : (
                        <Badge variant="brand">Upcoming</Badge>
                      )}
                      <Badge variant="neutral" className="gap-1">
                        <Users size={11} /> All students
                      </Badge>
                      {!approved && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {mc.approvalStatus === "pending"
                            ? "Awaiting admin approval"
                            : "Rejected by reviewer"}
                        </span>
                      )}
                      {mc.subject ? (
                        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink-muted">
                          {mc.subject}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 font-display text-lg font-bold text-ink">{mc.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{mc.topic}</p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-brand-700" />
                        {formatDate(mc.startsAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={16} className="text-brand-700" />
                        {formatTime(mc.startsAt)} – {formatTime(mc.endsAt)}
                      </span>
                    </div>

                    {mc.meetingPassword ? (
                      <MeetingPasscode value={mc.meetingPassword} className="mt-4" />
                    ) : null}

                    {mc.approvalStatus === "rejected" && mc.reviewNote ? (
                      <p className="mt-3 text-xs font-medium text-rose-600">
                        Reviewer note: {mc.reviewNote}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {!mc.meetingUrl ? (
                    <Button disabled className="h-11">
                      Link Missing
                    </Button>
                  ) : completed ? (
                    <a
                      href={mc.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-soft ring-1 ring-brand-200 transition-all hover:bg-brand-50"
                    >
                      Open Link <ExternalLink size={16} />
                    </a>
                  ) : (
                    <StartClassButton
                      liveClassId={mc.id}
                      status={mc.status}
                      disabled={!approved}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
          <p className="font-display text-2xl font-bold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}
