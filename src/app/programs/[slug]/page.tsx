export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/landing/site-header";
import { Footer } from "@/components/landing/footer";
import { ProgramCourseCard } from "@/components/course/program-course-card";
import { getProgramBySlug, getCoursesByProgram } from "@/lib/data";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  return { title: program ? `${program.name} Courses` : "Courses" };
}

export default async function ProgramPage({ params }: Params) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const courses = await getCoursesByProgram(slug);

  return (
    <main className="overflow-x-hidden">
      <SiteHeader />

      {/* Program hero band */}
      <section className={`bg-gradient-to-br ${program.accent} pb-12 pt-28`}>
        <div className="container-px">
          <nav className="mb-3 text-sm text-ink-muted">
            <span>All Courses</span> <span className="mx-1">/</span>
            <span className="font-semibold text-ink-soft">{program.name}</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-soft">
              {program.icon}
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
                {program.name}
              </h1>
              <p className="mt-1 text-ink-soft">{program.blurb}</p>
              <p className="mt-1 text-sm font-medium text-ink-muted">
                {program.audience} · {courses.length} course
                {courses.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-subtle py-14">
        <div className="container-px">
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-muted bg-white p-16 text-center">
              <span className="text-4xl">🚧</span>
              <p className="mt-3 font-display text-lg font-semibold text-ink-soft">Courses coming soon</p>
              <p className="mt-1 text-sm text-ink-muted">We're building something great. Check back shortly.</p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm font-medium text-ink-muted">
                Showing <span className="font-semibold text-ink">{courses.length}</span> course{courses.length !== 1 ? "s" : ""} in {program.name}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((c, i) => (
                  <ProgramCourseCard key={c.id} course={c} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
