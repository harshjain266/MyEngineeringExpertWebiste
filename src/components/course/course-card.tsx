"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, PlayCircle } from "lucide-react";
import type { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { BuyNowButton } from "./buy-now-button";
import { formatINR } from "@/lib/utils";

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group flex h-full flex-col overflow-hidden rounded-none border border-surface-muted bg-white shadow-soft transition-all duration-300 hover:border-brand-500 hover:shadow-glow active:border-brand-600"
    >
      <Link href={`/courses/${course.slug}`} className="relative block aspect-[16/10] overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center justify-between text-[10px] font-medium text-ink-muted/80">
          <span className="rounded-sm bg-brand-50 px-2 py-0.5 text-brand-700">{course.category}</span>
        </div>

        <Link href={`/courses/${course.slug}`}>
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-tight text-ink transition-colors group-hover:text-brand-700">
            {course.title}
          </h3>
        </Link>

        <Link
          href={`/teachers/${course.instructor.id}`}
          className="flex items-center gap-2 rounded-lg transition-colors hover:text-brand-700"
        >
          <Image
            src={course.instructor.avatar}
            alt={course.instructor.name}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-[11px] text-ink-soft hover:text-brand-700">
            {course.instructor.name}
          </span>
        </Link>

        <div className="mt-auto flex items-center justify-between border-t border-surface-muted/60 pt-2.5">
          <div className="flex items-center gap-1 text-[10px] text-ink-muted/60">
            <Clock size={12} /> {course.durationHours} hrs
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-base font-bold text-ink">{formatINR(course.price)}</span>
          </div>
        </div>

        <div className="mt-2">
          {course.isEnrolled ? (
            <Link href={`/dashboard/my-courses/${course.slug}`} className="contents">
              <Button size="sm" className="h-8 w-full rounded-none bg-emerald-600 text-xs hover:bg-emerald-700">
                <PlayCircle size={14} /> Continue Learning
              </Button>
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/courses/${course.slug}`} className="contents">
                <Button variant="secondary" size="sm" className="w-full rounded-none h-8 text-xs">
                  Explore
                </Button>
              </Link>
              <BuyNowButton
                size="sm"
                className="w-full rounded-none h-8 text-xs"
                course={{ courseId: course.id, courseTitle: course.title, amount: course.price }}
              >
                Buy
              </BuyNowButton>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
