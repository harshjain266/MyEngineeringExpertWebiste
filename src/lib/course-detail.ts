import type { Course, CourseDetail } from "@/types";
import {
  avatarImage,
  formatClassDays,
  formatClassWindow,
  formatISTDate,
} from "@/lib/utils";

/**
 * Derives PW-style course-detail content (plans, schedule, teachers, tabs …)
 * deterministically from a Course. This is presentation content layered on top
 * of the real course record — no extra DB columns required.
 */

const roundTo = (n: number, step = 100) => Math.round(n / step) * step;

const fmtDate = (d: Date) => formatISTDate(d, { weekday: undefined, day: "numeric" });

/** The real batch dates, or null when an admin has not set them yet. */
function batchDates(course: Course) {
  const toDate = (v: Course["startsOn"]) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  return { start: toDate(course.startsOn), end: toDate(course.endsOn) };
}

export function buildCourseDetail(course: Course): CourseDetail {
  // Batch dates come from the course record. They used to be invented here
  // (today + 20 days, + 1 year), which is why every batch showed the same
  // fabricated window no matter what the admin had entered.
  const { start, end } = batchDates(course);

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

  const startLabel = start ? fmtDate(start) : "To be announced";
  const endLabel = end ? fmtDate(end) : "To be announced";

  return {
    audience: `For ${course.level} learners`,
    startsOn: startLabel,
    endsOn: endLabel,
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
        `Course Start: ${startLabel}`,
        `Course End: ${endLabel}`,
      ],
      mode: `Mode of Lectures: ${course.modeOfLectures?.trim() || "Live Online"}`,
      classDays: `Class Days: ${formatClassDays(course.classDays)}`,
      schedule: `Scheduled Time: ${formatClassWindow(
        course.classStartTime,
        course.classEndTime,
      )}`,
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
      ...(end
        ? [`The complete course is accessible until ${fmtDate(end)}.`]
        : []),
    ],
  };
}
