export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  FileStack,
  PlayCircle,
  Radio,
  Trophy,
  Video,
} from "lucide-react";
import { getDashboardData, getMyBatchLiveClasses } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { courseImage } from "@/lib/utils";

export const metadata: Metadata = { title: "My Courses" };

function lastSeen(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function MyCoursesPage() {
  const [data, batchClasses] = await Promise.all([
    getDashboardData(),
    getMyBatchLiveClasses(),
  ]);
  const enrolled = data.enrolled;

  // Which courses have something happening right now, so the card can say so.
  const liveByCourse = new Set(
    batchClasses
      .filter((c) => c.status === "Live" || c.status === "Ongoing")
      .map((c) => c.courseId)
      .filter(Boolean) as string[],
  );
  const upcomingByCourse = new Map<string, number>();
  for (const c of batchClasses) {
    if (!c.courseId) continue;
    upcomingByCourse.set(c.courseId, (upcomingByCourse.get(c.courseId) ?? 0) + 1);
  }

  const completed = enrolled.filter((e) => e.progress >= 100).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">My Courses</h1>
            <p className="text-sm text-ink-muted">
              Manage and continue your learning journey
            </p>
          </div>
        </div>

        {enrolled.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Stat icon={BookOpen} label="Enrolled" value={enrolled.length} />
            <Stat
              icon={Trophy}
              label="Avg. progress"
              value={`${data.stats.averageProgress}%`}
            />
            <Stat icon={Video} label="Completed" value={completed} />
          </div>
        )}
      </div>

      {enrolled.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-white py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-subtle text-ink-muted">
            <BookOpen size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink">No courses yet</h2>
          <p className="mt-2 text-ink-muted">You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/dashboard/browse" className="mt-6">
            <Button>View All Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrolled.map((item) => {
            const isLive = liveByCourse.has(item.course.id);
            const upcoming = upcomingByCourse.get(item.course.id) ?? 0;

            return (
              <div
                key={item.course.id}
                className="group flex flex-col overflow-hidden rounded-none border border-surface-muted bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
              >
                <Link
                  href={`/dashboard/my-courses/${item.course.slug}`}
                  className="relative block aspect-[16/9] overflow-hidden"
                >
                  <Image
                    src={courseImage(item.course.thumbnail)}
                    alt={item.course.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ink/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayCircle className="text-white" size={48} />
                  </div>

                  {isLive && (
                    <Badge variant="live" className="absolute left-3 top-3 gap-1 rounded-none">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      LIVE NOW
                    </Badge>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                      {item.course.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                      <Clock size={11} /> {lastSeen(item.lastAccessed)}
                    </span>
                  </div>

                  <Link href={`/dashboard/my-courses/${item.course.slug}`}>
                    <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-ink transition-colors group-hover:text-brand-700">
                      {item.course.title}
                    </h3>
                  </Link>
                  <Link
                    href={`/teachers/${item.course.instructor.id}`}
                    className="mt-1 inline-flex text-sm font-medium text-ink-muted transition-colors hover:text-brand-700"
                  >
                    {item.course.instructor.name}
                  </Link>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-soft">Progress</span>
                      <span className="font-bold text-brand-700">{item.progress}%</span>
                    </div>
                    <ProgressBar value={item.progress} />
                  </div>

                  {(upcoming > 0 || isLive) && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <Radio size={12} className="text-brand-600" />
                      {isLive
                        ? "A class is live right now"
                        : `${upcoming} class${upcoming === 1 ? "" : "es"} this week`}
                    </p>
                  )}

                  <div className="mt-auto flex gap-2 pt-6">
                    <Link
                      href={`/dashboard/my-courses/${item.course.slug}`}
                      className="flex-1"
                    >
                      <Button
                        className={
                          isLive
                            ? "w-full rounded-none bg-rose-600 hover:bg-rose-700"
                            : "w-full rounded-none bg-emerald-600 hover:bg-emerald-700"
                        }
                      >
                        {isLive ? "Join Live Class" : "Continue Learning"}
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/materials?course=${item.course.slug}`}
                      title="Study material"
                      className="grid h-10 w-11 shrink-0 place-items-center rounded-none border border-surface-muted text-ink-soft transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <FileStack size={17} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-surface-muted bg-white px-4 py-2.5">
      <Icon size={16} className="text-brand-600" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          {label}
        </p>
        <p className="font-display text-base font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
