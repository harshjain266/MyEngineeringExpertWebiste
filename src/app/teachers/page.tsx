import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/landing/site-header";
import { Footer } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { compactNumber, initials } from "@/lib/utils";

type _TeacherCourse = { id: string; title: string; disabled: boolean };
type _TeacherInstructor = { id: string; name: string; avatar: string | null; title: string | null; bio: string | null; qualifications: string | null; experience: string | null; students: number; courses: _TeacherCourse[] };

export const metadata = {
  title: "Our Teachers - EngineeringExpert",
};

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const instructors = await prisma.instructor.findMany({
    include: {
      courses: {
        select: { id: true, slug: true, title: true, disabled: true },
        where: { disabled: false },
        take: 3,
        orderBy: { title: "asc" },
      },
    },
    orderBy: [{ rating: "desc" }, { students: "desc" }],
  });

  return (
    <main className="min-h-screen bg-surface-subtle">
      <SiteHeader />
      <section className="border-b border-surface-muted bg-white pt-28">
        <div className="container-px pb-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                <GraduationCap size={14} /> Expert Faculty
              </span>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
                Learn from teachers students can actually trust.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
                Explore every public instructor profile, their expertise, and the courses
                linked to them through the platform catalog.
              </p>
            </div>
            <div className="rounded-3xl border border-surface-muted bg-surface-subtle p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-700 shadow-soft">
                  <Users size={24} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-muted">Available Faculty</p>
                  <p className="font-display text-3xl font-bold text-ink">{instructors.length}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-muted">
                Click a teacher to view their full profile, qualifications, experience,
                and all linked courses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-px py-12">
        {instructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-muted bg-white py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-subtle text-ink-muted">
              <Search size={30} />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-ink">No teachers listed yet</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Instructor profiles will appear here after they save their details.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {instructors.map((instructor: _TeacherInstructor) => {
              const profileComplete = Boolean(
                instructor.bio && instructor.qualifications && instructor.experience,
              );

              return (
                <Link
                  key={instructor.id}
                  href={`/teachers/${instructor.id}`}
                  className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,16,36,0.04),0_12px_30px_-22px_rgba(16,16,36,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_48px_-24px_rgba(76,57,184,0.45)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-violet-400 to-sky-400" />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-soft">
                          {instructor.avatar ? (
                            <Image
                              src={instructor.avatar}
                              alt={instructor.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center bg-brand-50 font-display text-lg font-bold text-brand-700">
                              {initials(instructor.name)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-bold text-ink transition-colors group-hover:text-brand-700">
                            {instructor.name}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-sm font-semibold text-ink-soft">
                            {instructor.title}
                          </p>
                        </div>
                      </div>

                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-surface-subtle text-ink-muted transition-colors group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700">
                        <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge
                        variant={profileComplete ? "success" : "neutral"}
                        className="rounded-lg px-2.5 py-1 text-[11px]"
                      >
                        <ShieldCheck size={12} />
                        {profileComplete ? "Verified Profile" : "Profile Updating"}
                      </Badge>
                      <Badge variant="brand" className="rounded-lg px-2.5 py-1 text-[11px]">
                        <BriefcaseBusiness size={12} />
                        Faculty
                      </Badge>
                    </div>

                    <p className="mt-4 min-h-[72px] line-clamp-3 text-sm leading-6 text-ink-muted">
                      {instructor.bio ||
                        "Experienced faculty focused on practical, exam-ready learning and clear concept building."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                          Students
                        </p>
                        <p className="mt-1 font-display text-xl font-bold text-ink">
                          {compactNumber(instructor.students)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                          Courses
                        </p>
                        <p className="mt-1 font-display text-xl font-bold text-ink">
                          {instructor.courses.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                        Linked Courses
                      </p>
                      {instructor.courses.length > 0 ? (
                        <div className="space-y-2">
                          {instructor.courses.map((course: _TeacherCourse) => (
                            <div
                              key={course.id}
                              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink-soft"
                            >
                              <BookOpen size={13} className="shrink-0 text-brand-600" />
                              <span className="line-clamp-1">{course.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium text-ink-muted">
                          Courses will appear here after assignment.
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="text-xs font-semibold text-ink-muted">
                        View full profile
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        Open <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
