import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Radio,
  Users,
  Video,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StartClassButton } from "@/components/instructor/start-class-button";
import { MeetingPasscode } from "@/components/ui/meeting-passcode";
import { MaterialManager } from "@/components/course/material-manager";
import { listCourseMaterials } from "@/lib/data";
import { courseImage } from "@/lib/utils";

type _LiveClass = { id: string; title: string; topic: string; status: string; startsAt: Date; endsAt: Date; subject: string | null; meetingUrl: string | null; meetingPassword: string | null; courseId: string | null };

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status: string): "live" | "neutral" | "warning" {
  if (status === "Live" || status === "Ongoing") return "live";
  if (status === "Completed") return "neutral";
  return "warning";
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true },
  });

  return { title: course ? `${course.title} Classes` : "Batch Classes" };
}

export default async function InstructorBatchDetailPage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { slug } = await params;

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });

  if (!instructor) notFound();

  const course = await prisma.course.findFirst({
    where: {
      slug,
      instructorId: instructor.id,
    },
    include: {
      liveClasses: {
        orderBy: { startsAt: "asc" },
      },
      _count: {
        select: { enrollments: true, liveClasses: true },
      },
    },
  });

  if (!course) notFound();

  // Ownership is proven by the `instructorId` filter above.
  const materials = await listCourseMaterials(course.id);

  const now = new Date();
  const upcoming = course.liveClasses.filter((liveClass: _LiveClass) => liveClass.startsAt >= now);
  const liveCount = course.liveClasses.filter(
    (liveClass: _LiveClass) => liveClass.status === "Live" || liveClass.status === "Ongoing",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link href="/instructor/batches">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} /> Back to My Batches
        </Button>
      </Link>

      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
          <div className="relative min-h-64 bg-brand-50">
            {course.thumbnail ? (
              <Image
                src={courseImage(course.thumbnail)}
                alt={course.title}
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <Badge className="absolute left-5 top-5" variant="neutral">
              {course.category}
            </Badge>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-700">
              Batch Classroom
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold text-ink">
              {course.title}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              All scheduled sessions for this batch. Teachers join from here; enrolled
              students join from their purchased course portal.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <HeroStat label="Students" value={course._count.enrollments} />
              <HeroStat label="Classes" value={course._count.liveClasses} />
              <HeroStat label="Upcoming" value={upcoming.length} />
              <HeroStat label="Live" value={liveCount} />
            </div>
          </div>
        </div>
      </section>

      <MaterialManager courseId={course.id} materials={materials} />

      <section className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">All Classes</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {course.liveClasses.length} class{course.liveClasses.length === 1 ? "" : "es"} scheduled in this batch.
            </p>
          </div>
          <Badge variant="brand" className="w-fit px-3 py-1">
            Teacher View
          </Badge>
        </div>

        {course.liveClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-surface-subtle px-6 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-700 shadow-soft">
              <Video size={26} />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">No classes scheduled yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
              Once live classes are created for this batch, they will appear here with join links.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {course.liveClasses.map((liveClass: _LiveClass) => {
              const isLive = liveClass.status === "Live" || liveClass.status === "Ongoing";
              const isCompleted = liveClass.status === "Completed";

              return (
                <article
                  key={liveClass.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition-all hover:border-brand-300 hover:shadow-card"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <span
                        className={
                          isLive
                            ? "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600"
                            : "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"
                        }
                      >
                        <Radio size={22} className={isLive ? "animate-pulse" : undefined} />
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(liveClass.status)}>
                            {isLive ? "Live Now" : liveClass.status}
                          </Badge>
                          {liveClass.subject ? (
                            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink-muted">
                              {liveClass.subject}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 font-display text-lg font-bold text-ink">
                          {liveClass.title}
                        </h3>
                        <p className="mt-1 text-sm text-ink-muted">{liveClass.topic}</p>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                          <span className="flex items-center gap-2">
                            <CalendarDays size={16} className="text-brand-700" />
                            {formatDate(liveClass.startsAt)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock size={16} className="text-brand-700" />
                            {formatTime(liveClass.startsAt)} - {formatTime(liveClass.endsAt)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Users size={16} className="text-brand-700" />
                            {course._count.enrollments} enrolled students
                          </span>
                        </div>

                        {liveClass.meetingPassword ? (
                          <MeetingPasscode value={liveClass.meetingPassword} className="mt-4" />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {liveClass.meetingUrl ? (
                        isCompleted ? (
                          <a
                            href={liveClass.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-soft ring-1 ring-brand-200 transition-all hover:bg-brand-50"
                          >
                            Open Link <ExternalLink size={16} />
                          </a>
                        ) : (
                          <StartClassButton
                            liveClassId={liveClass.id}
                            status={liveClass.status}
                          />
                        )
                      ) : (
                        <Button disabled className="h-11">
                          Link Missing
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
