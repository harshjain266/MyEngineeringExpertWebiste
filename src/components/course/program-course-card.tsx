"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Clock, PlayCircle, Signal } from "lucide-react";
import type { Course } from "@/types";
import { BuyNowButton } from "@/components/course/buy-now-button";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CATEGORY_THEME: Record<string, { gradient: string; chip: string; icon: string }> = {
  "Computer Science":    { gradient: "from-indigo-600 to-violet-700",  chip: "bg-indigo-500/20 text-indigo-100", icon: "💻" },
  "Electronics":         { gradient: "from-amber-500 to-orange-600",   chip: "bg-amber-400/20  text-amber-100",  icon: "⚡" },
  "Electrical":          { gradient: "from-yellow-500 to-amber-600",   chip: "bg-yellow-400/20 text-yellow-100", icon: "🔌" },
  "Mechanical":          { gradient: "from-slate-600 to-slate-800",    chip: "bg-slate-400/20  text-slate-100",  icon: "⚙️" },
  "Civil":               { gradient: "from-stone-500 to-stone-700",    chip: "bg-stone-400/20  text-stone-100",  icon: "🏗️" },
  "Information Technology": { gradient: "from-sky-500 to-blue-700",   chip: "bg-sky-400/20    text-sky-100",    icon: "🖧"  },
};

export function ProgramCourseCard({
  course,
  index = 0,
}: {
  course: Course;
  index?: number;
}) {
  const href = `/courses/${course.slug}`;
  const pathname = usePathname();
  const theme = CATEGORY_THEME[course.category] ?? {
    gradient: "from-brand-600 to-indigo-800",
    chip: "bg-white/20 text-white",
    icon: "📚",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-surface-muted bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-glow active:border-brand-600"
    >
      {/* ── Gradient header ── */}
      <Link href={href} className={cn("relative flex h-36 flex-col justify-between bg-gradient-to-br p-5", theme.gradient)}>
        {/* Category chip */}
        <span className={cn("self-start rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-sm", theme.chip)}>
          {course.category}
        </span>

        {/* Big emoji icon + initials */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-base font-bold leading-tight text-white drop-shadow line-clamp-2">
              {course.title}
            </p>
          </div>
          <span className="ml-3 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur-sm">
            {theme.icon}
          </span>
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Instructor */}
        <Link
          href={`/teachers/${course.instructor.id}?from=${encodeURIComponent(pathname)}`}
          className="flex items-center gap-2 rounded-lg transition-colors hover:text-brand-700"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
            {course.instructor.name.slice(0, 1)}
          </span>
          <span className="truncate text-[12px] font-medium text-ink-soft hover:text-brand-700">
            {course.instructor.name}
          </span>
        </Link>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-lg bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted">
            <BookOpen size={11} /> {course.lectures} lectures
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted">
            <Clock size={11} /> {course.durationHours} hrs
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted">
            <Signal size={11} /> {course.language}
          </span>
        </div>

        {/* Price + actions */}
        <div className="mt-auto border-t border-surface-muted/60 pt-3">
          <p className="mb-3 font-display text-xl font-extrabold text-ink">
            {formatINR(course.price)}
          </p>
          {course.isEnrolled ? (
            <Link
              href={`/dashboard/my-courses/${course.slug}`}
              className="flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <PlayCircle size={15} /> Continue Learning
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={href}
                className="flex h-9 items-center justify-center rounded-xl border border-surface-muted bg-surface-subtle text-xs font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                Explore
              </Link>
              <BuyNowButton
                size="sm"
                className="h-9 w-full rounded-xl text-xs font-semibold"
                course={{ courseId: course.id, courseTitle: course.title, amount: course.price }}
              >
                Buy Now
              </BuyNowButton>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
