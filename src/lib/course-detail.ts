import type { Course, CourseDetail } from "@/types";
import { avatarImage } from "@/lib/utils";

/**
 * Derives PW-style course-detail content (plans, schedule, teachers, tabs …)
 * deterministically from a Course. This is presentation content layered on top
 * of the real course record — no extra DB columns required.
 */

const roundTo = (n: number, step = 100) => Math.round(n / step) * step;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function buildCourseDetail(course: Course): CourseDetail {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 20);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);

  // Subjects from tags, falling back to the category.
  const subjects =
    course.tags.length > 0 ? course.tags.join(", ") : course.category;

  // ── Plans ──────────────────────────────────────────────────────────────
  const base = [
    "Live + Recorded Lectures",
    "Doubt Resolution by faculty",
    "Daily Practice Problems (DPPs)",
    "Regular Tests & full-length mocks",
    `${course.lectures}+ structured lectures`,
  ];
  const infinityExtra = [
    "Digital Preparation Kit (notes & PYQs)",
    "Topper Mentorship Program",
    "Khazana — chapter-wise question bank",
  ];
  const proExtra = [
    "1-on-1 personal mentor",
    "Backlog Killer revision sprints",
    "Priority doubt support",
  ];

  const plans: CourseDetail["plans"] = [
    { name: "Batch", price: course.price, features: base },
    {
      name: "Infinity",
      price: roundTo(course.price * 1.5),
      popular: true,
      features: [...base, ...infinityExtra],
    },
    {
      name: "Infinity Pro",
      price: roundTo(course.price * 1.9),
      features: [...base, ...infinityExtra, ...proExtra],
    },
  ];

  // ── Teachers (only the real instructor assigned to this course) ─────────
  const teachers: CourseDetail["teachers"] = [
    {
      name: course.instructor.name,
      subject: course.instructor.title,
      exp: "12+ Years Exp",
      avatar: avatarImage(course.instructor.avatar, course.instructor.name),
    },
  ];

  // ── Schedule (lectures split across the teachers) ───────────────────────
  const per = Math.max(1, Math.round(course.lectures / teachers.length));
  const schedule: CourseDetail["schedule"] = teachers.map((t, i) => ({
    subject: i === 0 ? course.title : `${t.subject} Module`,
    teacher: t.name,
    lectures:
      i === teachers.length - 1
        ? course.lectures - per * (teachers.length - 1)
        : per,
    plannerUrl: course.plannerUrl,
  }));

  return {
    audience: `For ${course.level} learners`,
    startsOn: fmtDate(start),
    endsOn: fmtDate(end),
    plans,
    features: [
      "Live Lectures by expert faculty",
      "DPP discussion by batch faculties",
      "Regular Tests & All-India Test Series",
      "Live Doubt Resolution",
      "Digital Preparation Kit",
      "Lecture recordings & summary notes",
    ],
    about: {
      duration: [
        `Course Start: ${fmtDate(start)}`,
        `Course End: ${fmtDate(end)}`,
      ],
      validity: `Validity: ${end.getFullYear()} exams.`,
      mode: "Mode of Lectures: Live Online",
      schedule: "Schedule: 2 classes/day, 5 days/week",
      subjects: `Subjects: ${subjects}`,
      extras: [
        "Exam guidance & mentorship support",
        "One-to-one emotional well-being support",
        "In-person help at EE offline centres",
      ],
    },
    schedule,
    teachers,
    freeContent: [
      { title: `${course.title} — Demo Lecture`, kind: "Video" },
      { title: "Orientation & Strategy Session", kind: "Video" },
      { title: "Sample DPP with solutions", kind: "PDF" },
    ],
    moreDetails: [
      "Live Lectures by expert faculties as per the schedule.",
      "NCERT/foundation punch videos & DPPs with video solutions.",
      "Digital Preparation Kit: chapter-wise notes, PYQs, blueprints & digital books.",
      "Scheduled tests & AITS held according to the planner.",
      "Revision classes provided after syllabus completion.",
      "24×7 doubt resolution powered by the Ask-AI feature.",
      `The complete course is accessible until the ${end.getFullYear()} exams.`,
    ],
  };
}
