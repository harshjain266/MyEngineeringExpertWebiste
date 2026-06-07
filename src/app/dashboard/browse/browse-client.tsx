"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Course } from "@/types";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mathematics",
];

export function BrowseCoursesClient({ initialCourses }: { initialCourses: Course[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredCourses = useMemo(() => {
    return initialCourses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor.name.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        activeCategory === "All" || c.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialCourses, search, activeCategory]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">All Courses</h1>
          <p className="text-sm text-ink-muted">Explore our wide range of engineering courses</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-none border border-surface-muted bg-white pl-10 pr-10 text-sm outline-none focus:border-brand-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" className="rounded-none h-10">
            <SlidersHorizontal size={18} /> Filter
          </Button>
        </div>
      </div>

      {/* Categories / Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-none border px-4 py-2 text-sm font-medium transition-all",
              activeCategory === cat
                ? "border-brand-600 bg-brand-600 text-white shadow-soft"
                : "border-surface-muted bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-ink-muted">
        Showing {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
        {activeCategory !== "All" && <span> in <span className="font-semibold text-ink">{activeCategory}</span></span>}
        {search && <span> matching <span className="font-semibold text-ink">&quot;{search}&quot;</span></span>}
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-surface-muted bg-white py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-subtle text-ink-muted">
            <Search size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink">No courses found</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
          <Button
            variant="ghost"
            className="mt-4 text-brand-600"
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
            }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
