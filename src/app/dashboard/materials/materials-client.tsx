"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarRange,
  FileStack,
  FolderOpen,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { MaterialList } from "@/components/course/material-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MaterialKind, StudyMaterial } from "@/types";

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  materials: StudyMaterial[];
  courses: CourseOption[];
  initialCourseId: string;
}

/** Relative date windows, evaluated against `createdAt`. */
const DATE_RANGES = [
  { value: "all", label: "Any time", days: null },
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 3 months", days: 90 },
] as const;

const KIND_FILTERS: { value: MaterialKind | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "note", label: "Notes" },
  { value: "assignment", label: "Assignments" },
  { value: "slide", label: "Slides" },
  { value: "reference", label: "Reference" },
  { value: "link", label: "Links" },
];

const controlCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

export function MaterialsClient({ materials, courses, initialCourseId }: Props) {
  const [courseId, setCourseId] = useState(initialCourseId);
  const [range, setRange] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState<MaterialKind | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const preset = DATE_RANGES.find((r) => r.value === range);
    let cutoff: number | null = null;
    if (preset?.days) {
      const d = new Date();
      d.setDate(d.getDate() - preset.days);
      cutoff = d.getTime();
    }

    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    // Inclusive end date — a material uploaded at 4pm on the "to" day counts.
    const toTs = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return materials.filter((m) => {
      if (courseId !== "all" && m.courseId !== courseId) return false;
      if (kind !== "all" && m.kind !== kind) return false;

      const ts = new Date(m.createdAt).getTime();
      if (cutoff !== null && ts < cutoff) return false;
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;

      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.courseTitle ?? "").toLowerCase().includes(q) ||
        (m.fileName ?? "").toLowerCase().includes(q)
      );
    });
  }, [materials, courseId, kind, range, from, to, query]);

  /** Group into date headings so a long list stays scannable. */
  const grouped = useMemo(() => {
    const map = new Map<string, StudyMaterial[]>();
    for (const m of filtered) {
      const key = new Date(m.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const hasFilters =
    courseId !== "all" || kind !== "all" || range !== "all" || from || to || query;

  const clearAll = () => {
    setCourseId("all");
    setKind("all");
    setRange("all");
    setFrom("");
    setTo("");
    setQuery("");
  };

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <FolderOpen size={30} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            No study material yet
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
            Study material is shared by your teacher inside each course you buy. Enroll in
            a course and everything they upload will appear here.
          </p>
          <Link href="/dashboard/browse" className="mt-6">
            <Button>Browse courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <FileStack size={28} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                Your Library
              </p>
              <h1 className="font-display text-3xl font-bold">Study Material</h1>
              <p className="mt-1 text-sm text-white/80">
                Notes, assignments and slides from every course you have bought — in one
                place.
              </p>
            </div>
            <div className="ml-auto rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
              <p className="font-display text-3xl font-bold">{materials.length}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Files
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-brand-600" />
          <h2 className="font-display text-base font-bold text-ink">Filter</h2>
          {hasFilters ? (
            <button
              onClick={clearAll}
              className="ml-auto flex items-center gap-1 rounded-full bg-surface-subtle px-3 py-1 text-xs font-bold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X size={12} /> Clear all
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="filter-course">
              Course
            </label>
            <select
              id="filter-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={controlCls}
            >
              <option value="all">All my courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="filter-range">
              Uploaded
            </label>
            <select
              id="filter-range"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                // A preset and an explicit range would fight each other.
                setFrom("");
                setTo("");
              }}
              className={controlCls}
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="filter-kind">
              Type
            </label>
            <select
              id="filter-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as MaterialKind | "all")}
              className={controlCls}
            >
              {KIND_FILTERS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="filter-search">
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                id="filter-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, file or course…"
                className={cn(controlCls, "pl-9")}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:max-w-md">
          <div>
            <label className={labelCls} htmlFor="filter-from">
              From date
            </label>
            <input
              id="filter-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setRange("all");
              }}
              className={controlCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="filter-to">
              To date
            </label>
            <input
              id="filter-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setRange("all");
              }}
              className={controlCls}
            />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-muted">
            Showing <span className="text-ink">{filtered.length}</span> of{" "}
            {materials.length} file{materials.length === 1 ? "" : "s"}
          </p>
          {courseId !== "all" && (
            <Link
              href={`/dashboard/my-courses/${courses.find((c) => c.id === courseId)?.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              <BookOpen size={15} /> Open this course
            </Link>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-muted bg-white px-6 py-16 text-center">
            <CalendarRange size={34} className="text-ink-muted/50" />
            <h3 className="mt-3 font-display text-lg font-bold text-ink">
              Nothing matches those filters
            </h3>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Try widening the date range or picking a different course.
            </p>
            {hasFilters ? (
              <button
                onClick={clearAll}
                className="mt-5 rounded-xl border border-surface-muted px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          grouped.map(([month, rows], i) => (
            <motion.div
              key={month}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
                  {month}
                </h3>
                <div className="h-px flex-1 bg-surface-muted" />
                <span className="text-xs font-semibold text-ink-muted">
                  {rows.length} file{rows.length === 1 ? "" : "s"}
                </span>
              </div>
              <MaterialList materials={rows} showCourse={courseId === "all"} />
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
}
