import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Video,
  Calendar,
  Clock,
  User,
  ExternalLink,
  ArrowRight,
  FileStack,
} from "lucide-react";
import {
  getCourseBySlug,
  getLiveClassesByCourse,
  getCourseMaterialsForStudent,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function CourseLiveClassesPage({ params }: Params) {
  const { slug } = await params;
  // Enrollment (not catalogue visibility) gates this page, so a student keeps
  // access to a course they paid for even if it is later pulled or unapproved.
  const course = await getCourseBySlug(slug, false);

  if (!course) notFound();

  const [liveClasses, materials] = await Promise.all([
    getLiveClassesByCourse(course.id),
    getCourseMaterialsForStudent(course.id),
  ]);
  const materialCount = materials.length;

  // Group by subject
  const groupedBySubject = liveClasses.reduce((acc, curr) => {
    const subject = curr.subject || "";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(curr);
    return acc;
  }, {} as Record<string, typeof liveClasses>);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{course.title}</h1>
          <p className="mt-1 text-ink-muted">Live Classes & Schedule for this week</p>
        </div>
        <Badge variant="neutral" className="w-fit h-fit px-3 py-1 text-sm font-semibold text-brand-700 border-brand-200 bg-brand-50">
          7 Days Schedule
        </Badge>
      </div>

      {/* Study material lives on its own page so this screen stays focused on
          the live schedule. */}
      <Link
        href={`/dashboard/materials?course=${course.slug}`}
        className="group flex flex-wrap items-center gap-4 rounded-3xl border border-surface-muted bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <FileStack size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-ink group-hover:text-brand-700">
            Study Material
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {materialCount === 0
              ? "Your teacher has not uploaded anything for this course yet."
              : `${materialCount} file${materialCount === 1 ? "" : "s"} shared by your teacher — notes, assignments and slides.`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
          Open library <ArrowRight size={15} />
        </span>
      </Link>

      {liveClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-white py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-subtle text-ink-muted">
            <Video size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink">No live classes scheduled</h2>
          <p className="mt-2 text-ink-muted">There are no live classes for this course in the next 7 days.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedBySubject).map(([subject, classes]) => (
            <section key={subject} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-surface-muted" />
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink-muted">{subject}</h2>
                <div className="h-px flex-1 bg-surface-muted" />
              </div>

              <div className="grid gap-4">
                {classes.map((lc) => (
                  (() => {
                    const canJoin =
                      (lc.status === "Live" || lc.status === "Ongoing") &&
                      Boolean(lc.meetingUrl);

                    return (
                      <div
                        key={lc.id}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-muted bg-white p-5 transition-all hover:border-brand-200 hover:shadow-soft sm:flex-row sm:items-center sm:gap-6"
                      >
                        {canJoin && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                        )}

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            {canJoin ? (
                              <Badge variant="live" className="gap-1 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE NOW
                              </Badge>
                            ) : (
                              <Badge variant="neutral" className="text-ink-soft">
                                Waiting for teacher
                              </Badge>
                            )}
                            <span className="text-xs font-medium text-ink-muted">
                              {lc.topic}
                            </span>
                          </div>

                          <h3 className="font-display text-lg font-bold text-ink group-hover:text-brand-700 transition-colors">
                            {lc.title}
                          </h3>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                            <span className="flex items-center gap-2">
                              <Calendar size={16} className="text-brand-600" />
                              {new Date(lc.startsAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock size={16} className="text-brand-600" />
                              {new Date(lc.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(lc.endsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-2">
                              <User size={16} className="text-brand-600" />
                              {lc.instructor.name}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center gap-3 sm:mt-0">
                          {canJoin ? (
                            <a
                              href={lc.meetingUrl ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto"
                            >
                              <Button className="w-full gap-2 rounded-xl" size="lg">
                                Join Now <ExternalLink size={16} />
                              </Button>
                            </a>
                          ) : (
                            <Button disabled className="w-full gap-2 rounded-xl" size="lg" variant="secondary">
                              Teacher has not started yet
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
