"use client";

import type { LearningStats } from "@/types";
import { ProgressRing } from "@/components/ui/progress";
import { SectionHeader } from "@/components/dashboard/section-header";

export function ProgressPanel({ stats }: { stats: LearningStats }) {
  const rows = [
    { label: "Hours Learned", value: `${stats.hoursLearned} hrs` },
    { label: "Lessons Completed", value: `${stats.lessonsCompleted}/${stats.lessonsTotal}` },
    { label: "Quizzes Attempted", value: `${stats.quizzesAttempted}/${stats.quizzesTotal}` },
    { label: "Avg. Score", value: `${stats.averageScore}%` },
  ];

  return (
    <div className="rounded-2xl border border-surface-muted bg-white p-4">
      <SectionHeader title="Your Learning Progress" />
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <ProgressRing value={stats.overallProgress} label="Overall" />
        <dl className="grid flex-1 grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-xl bg-surface-subtle p-3">
              <dt className="text-[11px] text-ink-muted">{r.label}</dt>
              <dd className="mt-0.5 font-display text-base font-bold text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
