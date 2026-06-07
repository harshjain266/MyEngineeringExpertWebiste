"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Course } from "@/types";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function PopularCourses({ courses }: { courses: Course[] }) {
  return (
    <section id="courses" className="bg-surface-subtle py-20">
      <div className="container-px">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              Trending now
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              Most popular courses
            </h2>
          </Reveal>
          <Link href="/dashboard/browse">
            <Button variant="secondary" size="sm">
              View all courses <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.slice(0, 8).map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
