import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Radio,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { compactNumber } from "@/lib/utils";
import ProfileForm from "@/app/instructor/settings/profile/profile-form";
import { StartClassButton } from "@/components/instructor/start-class-button";

type _LiveClass = { id: string; title: string; topic: string; status: string; startsAt: Date; endsAt: Date; meetingUrl: string | null; courseId: string | null };
type _BatchCourse = { id: string; slug: string; title: string; thumbnail: string | null; category: string; durationHours: number | null; liveClasses: _LiveClass[]; _count: { enrollments: number; liveClasses: number } };
type _LiveClassWithCourse = _LiveClass & { course: { title: string; slug: string } };

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instructor Dashboard",
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

export default async function InstructorDashboardPage() {
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
  const allClasses = batches.flatMap((course: _BatchCourse) =>
    course.liveClasses.map((liveClass: _LiveClass) => ({ ...liveClass, course })),
  );
  const upcomingClasses = allClasses
    .filter((item: _LiveClassWithCourse) => item.startsAt >= now)
    .sort((a: _LiveClassWithCourse, b: _LiveClassWithCourse) => a.startsAt.getTime() - b.startsAt.getTime());
  const nextClass = upcomingClasses[0];
  const totalStudents = batches.reduce(
    (sum: number, course: _BatchCourse) => sum + course._count.enrollments,
    0,
  );

  const completedFields = [
    instructor?.name,
    instructor?.title,
    instructor?.avatar,
    instructor?.bio,
    instructor?.qualifications,
    instructor?.experience,
  ].filter(Boolean).length;
  const completion = Math.round((completedFields / 6) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-brand-gradient p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <GraduationCap size={25} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                  Instructor Portal
                </p>
                <h1 className="font-display text-3xl font-bold">
                  Welcome, {instructor?.name?.split(" ")[0] ?? user.name.split(" ")[0]}
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/82">
              Manage your batches, open class schedules, and join live sessions from
              one place. Students will join the same classes from their purchased
              course portal.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/instructor/batches">
                <Button variant="secondary" size="sm">
                  View My Batches <ArrowRight size={15} />
                </Button>
              </Link>
              <Link href="/instructor/settings/profile">
                <Button variant="outline" size="sm">
                  Update Profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard
              icon={Layers3}
              label="Assigned Batches"
              value={String(batches.length)}
              hint="Courses mapped to your instructor ID"
            />
            <MetricCard
              icon={Radio}
              label="Total Classes"
              value={String(allClasses.length)}
              hint={`${upcomingClasses.length} upcoming sessions`}
            />
            <MetricCard
              icon={Users}
              label="Students"
              value={compactNumber(totalStudents)}
              hint="Across your assigned batches"
            />
          </div>
        </div>
      </section>

      {nextClass ? (
        <section className="rounded-3xl border border-brand-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Radio size={22} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">Next Class</Badge>
                  <span className="text-xs font-semibold text-ink-muted">
                    {formatClassTime(nextClass.startsAt)}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-xl font-bold text-ink">
                  {nextClass.title}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {nextClass.course.title} · {nextClass.topic}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/instructor/batches/${nextClass.course.slug}`}>
                <Button variant="secondary">Open Batch</Button>
              </Link>
              {nextClass.meetingUrl ? (
                <StartClassButton liveClassId={nextClass.id} status={nextClass.status} />
              ) : (
                <Button disabled>Class Link Missing</Button>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">My Batches</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Open a batch to view all classes and join links for that course.
              </p>
            </div>
<Link href="/instructor/batches">
                <Button variant="secondary" size="sm">
                  View My Batches <ArrowRight size={15} />
                </Button>
              </Link>
              <Link href="/instructor/settings/profile">
                <Button variant="outline" size="sm">
                  Update Profile
                </Button>
              </Link>
            </div>

          {batches.length === 0 ? (
            <EmptyState
              title="No batches assigned yet"
              body="Ask an admin to assign your instructor ID to a course. Your batches and class links will appear here automatically."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {batches.slice(0, 4).map((course: _BatchCourse) => {
                const nextBatchClass = course.liveClasses.find((liveClass: _LiveClass) => liveClass.startsAt >= now);

                return (
                  <Link
                    href={`/instructor/batches/${course.slug}`}
                    key={course.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
                  >
                    <div className="relative aspect-[16/8] bg-brand-50">
                      {course.thumbnail ? (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 420px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                      <Badge className="absolute left-4 top-4" variant="neutral">
                        {course.category}
                      </Badge>
                      <h3 className="absolute bottom-4 left-4 right-4 line-clamp-2 font-display text-lg font-bold text-white">
                        {course.title}
                      </h3>
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <BatchStat label="Students" value={course._count.enrollments} />
                        <BatchStat label="Classes" value={course._count.liveClasses} />
                        <BatchStat label="Hours" value={course.durationHours ?? 0} />
                      </div>
                      <div className="rounded-2xl bg-surface-subtle p-3">
                        <p className="text-xs font-semibold text-ink-muted">Next session</p>
                        <p className="mt-1 text-sm font-bold text-ink">
                          {nextBatchClass ? formatClassTime(nextBatchClass.startsAt) : "No upcoming class"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg font-bold text-ink">Profile Completion</h3>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-brand-50">
                {instructor?.avatar || user.avatar ? (
                  <Image
                    src={instructor?.avatar || user.avatar}
                    alt={instructor?.name || user.name}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-ink">
                  {instructor?.name || user.name}
                </p>
                <p className="truncate text-sm font-medium text-brand-700">
                  {instructor?.title || "Add your teaching title"}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-surface-subtle p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-ink">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Public profile
                </span>
                <span>{completion}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <Link href="/instructor/settings/profile" className="mt-4 block">
              <Button variant="secondary" className="w-full">
                Edit Profile
              </Button>
            </Link>
          </section>

          {!instructor ? (
            <section className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
              <h3 className="font-display text-lg font-bold text-ink">Create Instructor Profile</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Save your details once so admins can map courses to your teacher profile.
              </p>
              <div className="mt-5">
                <ProfileForm initialData={null} />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-muted bg-surface-subtle p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700 shadow-soft">
          <Icon size={19} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {label}
          </p>
          <p className="font-display text-2xl font-bold text-ink">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

function BatchStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-surface-subtle px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-700 shadow-soft">
        <BookOpen size={26} />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">{body}</p>
    </div>
  );
}
