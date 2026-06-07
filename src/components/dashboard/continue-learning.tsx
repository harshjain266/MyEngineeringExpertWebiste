"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import type { EnrolledCourse } from "@/types";
import { Button } from "@/components/ui/button";

export function ContinueLearning({ items }: { items: EnrolledCourse[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <motion.div
          key={item.course.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: i * 0.06 }}
          className="group flex gap-3 rounded-none border border-surface-muted bg-white p-3 transition-all hover:border-brand-200 hover:shadow-card"
        >
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-none">
            <Image
              src={item.course.thumbnail}
              alt={item.course.title}
              fill
              sizes="112px"
              className="object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute inset-0 grid place-items-center bg-ink/20 opacity-0 transition-opacity group-hover:opacity-100">
              <PlayCircle className="text-white" size={28} />
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="truncate font-display text-sm font-semibold text-ink">
              {item.course.title}
            </h3>
            <p className="text-xs text-ink-muted">{item.course.instructor.name}</p>
            <div className="mt-auto">
              <Button size="sm" variant="subtle" className="h-7 px-3 text-[10px] rounded-none">Resume Course</Button>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="sm:col-span-2">
        <Button variant="subtle" size="sm" className="w-full">
          View all my courses
        </Button>
      </div>
    </div>
  );
}
