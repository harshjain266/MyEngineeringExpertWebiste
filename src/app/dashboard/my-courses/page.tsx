export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { BookOpen, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";

export const metadata: Metadata = { title: "My Courses" };

export default async function MyCoursesPage() {
  const data = await getDashboardData();
  const enrolled = data.enrolled;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">My Courses</h1>
          <p className="text-sm text-ink-muted">Manage and continue your learning journey</p>
        </div>
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
          {enrolled.map((item) => (
            <div
              key={item.course.id}
              className="group flex flex-col overflow-hidden rounded-none border border-surface-muted bg-white shadow-soft transition-all hover:shadow-card"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={item.course.thumbnail}
                  alt={item.course.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-ink/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayCircle className="text-white" size={48} />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">
                  {item.course.category}
                </div>
                <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-ink">
                  {item.course.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{item.course.instructor.name}</p>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-ink-soft">Progress</span>
                    <span className="text-brand-700">{item.progress}%</span>
                  </div>
                  <ProgressBar value={item.progress} className="h-2 rounded-none" />
                </div>

                <div className="mt-auto pt-6">
                  <Link href={`/courses/${item.course.slug}`}>
                    <Button className="w-full rounded-none">Resume Learning</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
