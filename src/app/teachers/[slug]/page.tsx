import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, GraduationCap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/landing/site-header";
import { Footer } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";

type _TeacherCourse = { id: string; slug: string; title: string; thumbnail: string | null; level: string; disabled: boolean };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instructor = await prisma.instructor.findUnique({
    where: { id: slug },
  });

  if (!instructor) return { title: "Teacher Not Found" };

  return {
    title: `${instructor.name} - EngineeringExpert`,
  };
}

export default async function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;

  const instructor = await prisma.instructor.findUnique({
    where: { id: slug },
    include: {
      courses: true,
    },
  });

  if (!instructor) {
    notFound();
  }

  const activeCourses = instructor.courses.filter((c) => !c.disabled);

  return (
    <main className="min-h-screen bg-surface-subtle">
      <SiteHeader />

      <section className="border-b border-surface-muted bg-white pt-28">
        <div className="container-px pb-10">
          <Link
            href={from || "/teachers"}
            className="mb-5 inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <ArrowRight size={15} className="mr-1 rotate-180" /> Back
          </Link>

          <div className="grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="relative h-36 w-36 overflow-hidden rounded-3xl bg-brand-50 shadow-card ring-4 ring-white md:h-44 md:w-44">
            <Image
              src={instructor.avatar || "https://i.pravatar.cc/300"}
              alt={instructor.name}
              fill
              className="object-cover"
            />
          </div>
          
            <div className="min-w-0">
              <Badge variant="brand">EngineeringExpert Faculty</Badge>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              {instructor.name}
            </h1>
              <p className="mt-2 text-xl font-semibold text-brand-700">
              {instructor.title}
            </p>
            
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <div className="flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-2">
                <Stars rating={instructor.rating || 5} />
                  <span className="font-semibold text-ink">
                  {instructor.rating ? instructor.rating.toFixed(1) : "5.0"}
                </span>
              </div>
                <div className="flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-2">
                  <Users size={15} className="text-brand-600" />
                  <span><strong className="text-ink">{instructor.students.toLocaleString()}</strong> students</span>
              </div>
                <div className="flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-2">
                  <BookOpen size={15} className="text-brand-600" />
                  <span><strong className="text-ink">{activeCourses.length}</strong> courses</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-surface-muted bg-surface-subtle p-5 lg:w-72">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
                Teaching Focus
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {activeCourses.length > 0
                  ? activeCourses.slice(0, 2).map((c: _TeacherCourse) => c.title).join(", ")
                  : instructor.title}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-px py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <ProfileSection title="About" icon={Users}>
              <p className="text-sm leading-7 text-ink-soft">
                {instructor.bio || "This teacher is building their public profile. Course details and linked classes are available below."}
              </p>
            </ProfileSection>

            {/* Qualifications */}
            {instructor.qualifications && (
              <ProfileSection title="Qualifications" icon={GraduationCap}>
                <div className="whitespace-pre-wrap text-sm leading-7 text-ink-soft">
                  {instructor.qualifications}
                </div>
              </ProfileSection>
            )}

            {/* Experience */}
            {instructor.experience && (
              <ProfileSection title="Experience" icon={BriefcaseBusiness}>
                <div className="whitespace-pre-wrap text-sm leading-7 text-ink-soft">
                  {instructor.experience}
                </div>
              </ProfileSection>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-ink">
              Courses by {instructor.name.split(" ")[0]}
            </h3>
            {activeCourses.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-surface-muted bg-white p-6 text-sm text-ink-muted">
                No courses are linked to this teacher yet.
              </p>
            ) : (
              <div className="space-y-4">
                {activeCourses.map((course: _TeacherCourse) => (
                  <Link href={`/courses/${course.slug}`} key={course.id} className="block group">
                    <div className="flex items-center gap-4 rounded-3xl border border-surface-muted bg-white p-4 shadow-soft transition-colors group-hover:border-brand-300 group-hover:bg-brand-50/40">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                        {course.thumbnail ? (
                          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                            {course.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="line-clamp-2 font-semibold text-ink transition-colors group-hover:text-brand-700">
                          {course.title}
                        </h4>
                        <p className="mt-1 text-sm text-ink-muted">{course.level}</p>
                      </div>
                      <ArrowRight size={16} className="text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-700" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-surface-muted bg-white p-6 shadow-soft md:p-8">
      <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-bold text-ink">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon size={20} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
