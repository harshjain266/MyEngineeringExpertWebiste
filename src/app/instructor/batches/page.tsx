import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Layers3, Radio, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactNumber, courseImage } from "@/lib/utils";

type _LiveClass = { id: string; title: string; topic: string; status: string; startsAt: Date; endsAt: Date; meetingUrl: string | null; courseId: string | null };
type _BatchCourse = { id: string; slug: string; title: string; thumbnail: string | null; category: string; level: string; durationHours: number | null; lectures: number | null; liveClasses: _LiveClass[]; _count: { enrollments: number; liveClasses: number } };

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Batches",
};

function formatClassTime(date: Date) {
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InstructorBatchesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
    include: {
      courses: {
        include: {
          liveClasses: {
            orderBy: { startsAt: "asc" },
          },
          _count: {
            select: { enrollments: true, liveClasses: true },
          },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  const now = new Date();
  const batches = instructor?.courses ?? [];
  const totalClasses = batches.reduce((sum: number, course: _BatchCourse) => sum + course._count.liveClasses, 0);
  const totalStudents = batches.reduce((sum: number, course: _BatchCourse) => sum + course._count.enrollments, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Layers3 size={25} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Teaching Workspace
              </p>
              <h1 className="font-display text-3xl font-bold">My Batches</h1>
              <p className="mt-1 text-sm text-white/80">
                Open any assigned batch to see all classes and join links.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={Layers3} label="Assigned Batches" value={String(batches.length)} />
        <SummaryCard icon={Radio} label="Classes" value={String(totalClasses)} />
        <SummaryCard icon={Users} label="Students" value={compactNumber(totalStudents)} />
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <BookOpen size={30} />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">No batches assigned yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
            Once an admin links a course to your instructor profile, that batch will appear here.
          </p>
          <Link href="/instructor/settings/profile" className="mt-6">
            <Button variant="secondary">Complete Profile</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {batches.map((course: _BatchCourse) => {
            const nextClass = course.liveClasses.find((liveClass: _LiveClass) => liveClass.startsAt >= now);

            return (
              <Link
                href={`/instructor/batches/${course.slug}`}
                key={course.id}
                className="group grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-card md:grid-cols-[220px_1fr]"
              >
                <div className="relative min-h-56 bg-brand-50 md:min-h-full">
                  {course.thumbnail ? (
                    <Image
                      src={courseImage(course.thumbnail)}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 220px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent" />
                  <Badge className="absolute left-4 top-4" variant="neutral">
                    {course.category}
                  </Badge>
                </div>

                <div className="flex min-w-0 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-display text-xl font-bold text-ink group-hover:text-brand-700">
                        {course.title}
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">
                        {course.level} · {course.durationHours} hours · {course.lectures} lectures
                      </p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-subtle text-ink-muted group-hover:bg-brand-50 group-hover:text-brand-700">
                      <ArrowRight size={18} />
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <BatchMetric label="Students" value={course._count.enrollments} />
                    <BatchMetric label="Classes" value={course._count.liveClasses} />
                    <BatchMetric label="Live" value={course.liveClasses.filter((liveClass: _LiveClass) => liveClass.status === "Live" || liveClass.status === "Ongoing").length} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <CalendarDays size={18} className="mt-0.5 text-brand-700" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                          Next Class
                        </p>
                        <p className="mt-1 text-sm font-bold text-ink">
                          {nextClass ? formatClassTime(nextClass.startsAt) : "No upcoming class scheduled"}
                        </p>
                        {nextClass ? (
                          <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
                            {nextClass.title}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon size={21} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
          <p className="font-display text-2xl font-bold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BatchMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
