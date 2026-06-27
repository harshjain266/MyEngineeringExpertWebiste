"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Download,
  Laptop,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import type { Course, CourseDetail } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyNowButton } from "@/components/course/buy-now-button";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "features", label: "Features" },
  { id: "about", label: "About" },
  { id: "schedule", label: "Schedule" },
  { id: "teachers", label: "Teachers" },
  { id: "more-details", label: "More Details" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CourseDetailView({
  course,
  detail,
  isPurchased = false,
}: {
  course: Course;
  detail: CourseDetail;
  isPurchased?: boolean;
}) {
  const filteredTabs = TABS.filter((tab) => !isPurchased || tab.id !== "features");
  const [activeTab, setActiveTab] = useState<TabId>(isPurchased ? "about" : "features");
  const isManualScrolling = useRef(false);

  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrolling.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id as TabId);
          }
        });
      },
      {
        rootMargin: "-150px 0px -70% 0px",
      }
    );

    filteredTabs.forEach((tab) => {
      const element = document.getElementById(tab.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [filteredTabs]);

  useEffect(() => {
    // Scroll the tab into view horizontally if it's the active one
    const activeTabElement = tabsRef.current?.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeTabElement) {
      activeTabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  const scrollToSection = (id: TabId) => {
    const element = document.getElementById(id);
    if (element) {
      isManualScrolling.current = true;
      setActiveTab(id);
      
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Reset manual scrolling flag after animation finishes
      setTimeout(() => {
        isManualScrolling.current = false;
      }, 800);
    }
  };

  return (
    <div className="bg-surface-subtle pb-16 pt-20">
      {/* Title band */}
      <div className="border-b border-surface-muted bg-white">
        <div className="container-px py-6">
          <nav className="mb-2 text-sm text-ink-muted">
            All Courses <span className="mx-1">/</span>
            <span className="font-semibold text-ink-soft">{course.title}</span>
          </nav>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {course.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span className="flex items-center gap-1">
              <Users size={14} /> {detail.audience}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> Starts {detail.startsOn}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} className="text-brand-600" /> {course.enrollmentCount?.toLocaleString() || "1,240"} students enrolled
            </span>
          </div>
        </div>
      </div>

      {/* Sticky tab bar - Moved outside to stick over the body */}
      <div className="sticky top-16 z-40 border-b border-surface-muted bg-white/95 backdrop-blur shadow-sm">
        <div 
          ref={tabsRef}
          className="container-px flex gap-1 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {filteredTabs.map((t) => (
            <button
              key={t.id}
              data-tab-id={t.id}
              onClick={() => scrollToSection(t.id)}
              className={cn(
                "relative whitespace-nowrap px-4 py-3.5 text-sm font-semibold transition-colors",
                activeTab === t.id ? "text-brand-700" : "text-ink-muted hover:text-ink-soft",
              )}
            >
              {t.label}
              {activeTab === t.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="container-px mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          {!isPurchased && (
            <section id="features" className="scroll-mt-32">
              <FeaturesPanel course={course} detail={detail} />
            </section>
          )}
          <section id="about" className="scroll-mt-32">
            <AboutPanel detail={detail} />
          </section>
          <section id="schedule" className="scroll-mt-32">
            <SchedulePanel detail={detail} />
          </section>
          <section id="teachers" className="scroll-mt-32">
            <TeachersPanel course={course} detail={detail} />
          </section>
          <section id="more-details" className="scroll-mt-32">
            <MoreDetailsPanel detail={detail} />
          </section>
        </div>

        {/* Sticky purchase card */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-surface-muted bg-white shadow-card">
            <div className="relative aspect-[16/9]">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                sizes="360px"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-md bg-brand-700 px-2 py-0.5 text-xs font-bold text-white">
                ONLINE
              </span>
            </div>
            <div className="space-y-3 p-4">
              <h3 className="font-display text-lg font-bold text-ink">{course.title}</h3>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Users size={14} /> {detail.audience}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <CalendarDays size={14} /> {detail.startsOn} – {detail.endsOn}
              </p>
              {!isPurchased && (
                <>
                  <div className="flex items-baseline gap-2 border-t border-surface-muted pt-3">
                    <span className="font-display text-2xl font-bold text-brand-700">
                      {formatINR(course.price)}
                    </span>
                  </div>
                  <BuyNowButton
                    size="lg"
                    className="w-full"
                    course={{ courseId: course.id, courseTitle: course.title, amount: course.price, planName: "Batch" }}
                  >
                    Continue with Batch
                  </BuyNowButton>
                </>
              )}
              {isPurchased && (
                <div className="border-t border-surface-muted pt-3">
                  <Button className="w-full" variant="outline" disabled>
                    Already Enrolled
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── Panels ───────────────────────── */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-muted bg-white p-6 shadow-soft">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const PLAN_THEMES = [
  {
    card: "bg-slate-800 border-slate-700",
    header: "bg-slate-700/60",
    title: "text-slate-100",
    price: "text-white",
    feature: "text-slate-300",
    check: "text-sky-400",
    btn: "bg-slate-600 hover:bg-slate-500 text-white",
  },
  {
    card: "bg-gradient-to-br from-brand-700 to-indigo-900 border-brand-500",
    header: "bg-white/10",
    title: "text-white",
    price: "text-white",
    feature: "text-brand-100",
    check: "text-emerald-300",
    btn: "bg-white text-brand-800 hover:bg-brand-50",
  },
  {
    card: "bg-slate-900 border-slate-700",
    header: "bg-amber-500/15",
    title: "text-amber-300",
    price: "text-amber-300",
    feature: "text-slate-300",
    check: "text-amber-400",
    btn: "bg-amber-500 hover:bg-amber-400 text-slate-900",
  },
] as const;

function FeaturesPanel({ course, detail }: { course: Course; detail: CourseDetail }) {
  return (
    <div className="space-y-6">
      <Card title="Batch Features">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {detail.plans.map((plan, i) => {
            const theme = PLAN_THEMES[i % PLAN_THEMES.length];
            return (
              <div
                key={`${plan.name}-${i}`}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl border shadow-md",
                  theme.card,
                )}
              >
                {plan.popular && (
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
                    Most Popular
                  </span>
                )}
                <div className={cn("px-5 pt-5 pb-4", theme.header)}>
                  <h3 className={cn("font-display text-xl font-bold", theme.title)}>
                    {plan.name}
                  </h3>
                  <p className={cn("mt-1 font-display text-2xl font-extrabold", theme.price)}>
                    {formatINR(plan.price)}
                  </p>
                </div>
                <ul className="flex-1 space-y-2.5 px-5 py-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className={cn("mt-0.5 shrink-0", theme.check)} />
                      <span className={theme.feature}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="px-5 pb-5">
                  <BuyNowButton
                    className={cn(
                      "w-full rounded-xl py-2.5 text-sm font-semibold transition-colors border-0",
                      theme.btn,
                    )}
                    course={{ courseId: course.id, courseTitle: course.title, amount: plan.price, planName: plan.name }}
                  >
                    Continue with {plan.name}
                  </BuyNowButton>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="What you get">
        <ul className="grid gap-3 sm:grid-cols-2">
          {detail.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
              <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
              {f}
            </li>
          ))}
        </ul>
        {course.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {course.tags.map((t) => (
              <Badge key={t} variant="neutral">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function parseKV(raw: string): { label: string; value: string } {
  const idx = raw.indexOf(":");
  if (idx === -1) return { label: "", value: raw };
  return { label: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() };
}

const ABOUT_ICONS: Record<string, React.ElementType> = {
  "Course Start": CalendarDays,
  "Course End": CalendarDays,
  Validity: Shield,
  "Mode of Lectures": Laptop,
  Schedule: Clock,
  Subjects: BookOpen,
};

function AboutPanel({ detail }: { detail: CourseDetail }) {
  const kvRows = [
    ...detail.about.duration,
    detail.about.validity,
    detail.about.mode,
    detail.about.schedule,
    detail.about.subjects,
  ].map(parseKV);

  return (
    <div className="space-y-5">
      <Card title="About the Batch">
        <div className="grid gap-4 sm:grid-cols-2">
          {kvRows.map(({ label, value }, i) => {
            const Icon = ABOUT_ICONS[label] ?? CalendarDays;
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-surface-muted bg-surface-subtle p-4"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted/70">
                    {label || "Info"}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Additional Benefits">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {detail.about.extras.map((extra, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-surface-muted bg-gradient-to-br from-brand-50 to-white p-4"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                <Sparkles size={15} />
              </span>
              <span className="text-sm font-medium leading-snug text-ink-soft">{extra}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function SchedulePanel({ detail }: { detail: CourseDetail }) {
  const tones = ["bg-sky-50 border-sky-400", "bg-violet-50 border-violet-400", "bg-amber-50 border-amber-400"];
  return (
    <Card title="Batch Schedules">
      <div className="space-y-3">
        {detail.schedule.map((s, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border-l-4 px-4 py-3.5",
              tones[i % tones.length],
            )}
          >
            <div>
              <div className="font-semibold text-ink">{s.subject}</div>
              <div className="text-xs text-ink-muted">
                {s.lectures} Lectures · {s.teacher}
              </div>
            </div>
            {s.plannerUrl ? (
              <a
                href={s.plannerUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Download size={14} /> Download
              </a>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white opacity-50 cursor-not-allowed"
              >
                <Download size={14} /> Download
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function TeachersPanel({ course, detail }: { course: Course; detail: CourseDetail }) {
  const supportTeachers = detail.teachers.filter((t) => t.name !== course.instructor.name);

  return (
    <Card title="Know your Teachers">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/teachers/${course.instructor.id}`}
          className="group flex flex-col items-center rounded-2xl border border-brand-200 bg-brand-50/60 p-5 text-center transition-all hover:-translate-y-1 hover:border-brand-400 hover:bg-white hover:shadow-card"
        >
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white">
            <Image
              src={course.instructor.avatar}
              alt={course.instructor.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="mt-3 font-semibold text-ink transition-colors group-hover:text-brand-700">
            {course.instructor.name}
          </div>
          <div className="text-sm text-ink-muted">{course.instructor.title}</div>
          <span className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">
            Lead Faculty
          </span>
        </Link>

        {supportTeachers.map((t, i) => (
          <div
            key={`${t.name}-${i}`}
            className="flex flex-col items-center rounded-2xl border border-surface-muted p-5 text-center"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-amber-100">
              <Image src={t.avatar} alt={t.name} fill sizes="80px" className="object-cover" />
            </div>
            <div className="mt-3 font-semibold text-ink">{t.name}</div>
            <div className="text-sm text-ink-muted">{t.subject}</div>
            <span className="mt-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-soft">
              {t.exp}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}


function MoreDetailsPanel({ detail }: { detail: CourseDetail }) {
  return (
    <Card title="More Details">
      <ol className="space-y-3">
        {detail.moreDetails.map((d, i) => (
          <li
            key={i}
            className="flex gap-3 border-b border-surface-muted pb-3 text-sm text-ink-soft last:border-0"
          >
            <span className="font-display font-bold text-brand-600">
              {String(i + 1).padStart(2, "0")}.
            </span>
            {d}
          </li>
        ))}
      </ol>
    </Card>
  );
}
