/** Shared domain types for EngineeringExpert. */

export type Level = "Beginner" | "Intermediate" | "Advanced";

export type CourseCategory =
  | "Computer Science"
  | "Electronics"
  | "Electrical"
  | "Mechanical"
  | "Civil"
  | "Information Technology";

export interface Instructor {
  id: string;
  userId?: string;
  name: string;
  title: string;
  avatar: string;
  bio?: string;
  qualifications?: string;
  experience?: string;
  rating: number;
  students: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: CourseCategory;
  program: string; // Program slug this course belongs to (see config/programs)
  level: Level;
  instructor: Instructor;
  price: number;
  originalPrice: number;
  rating: number;
  ratingCount: number;
  durationHours: number;
  lectures: number;
  language: string;
  thumbnail: string;
  badge?: string;
  tags: string[];
  plannerUrl?: string;
  popular?: boolean;
  enrollmentCount?: number;
  isEnrolled?: boolean;
}

export interface EnrolledCourse {
  course: Course;
  progress: number; // 0–100
  lastAccessed: string;
}

export interface LiveClass {
  id: string;
  title: string;
  topic: string;
  subject?: string | null;
  meetingUrl?: string | null;
  instructor: Instructor;
  startsAt: string; // ISO
  endsAt: string; // ISO
  status: "Upcoming" | "Live" | "Ongoing" | "Completed";
  courseId?: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  tone: "info" | "offer" | "schedule";
}

export interface Order {
  id: string;
  date: string;
  course: string;
  amount: number;
  status: "Success" | "Failed" | "Pending";
}

export interface LearningStats {
  enrolledCourses: number;
  averageProgress: number;
  certificatesEarned: number;
  hoursLearned: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  quizzesAttempted: number;
  quizzesTotal: number;
  averageScore: number;
  overallProgress: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  role: "student" | "instructor" | "admin" | "superadmin";
  plan: "free" | "premium";
}

/** A program / track shown in the "All Courses" mega-menu (e.g. BTECH/BCA, DSA). */
export interface Program {
  slug: string;
  name: string;
  group: string; // mega-menu section heading
  blurb: string;
  audience: string;
  icon: string; // emoji glyph
  accent: string; // tailwind gradient classes
}

/** A purchasable plan tier on a course-detail page (Batch / Infinity / Infinity Pro). */
export interface CoursePlan {
  name: string;
  price: number;
  popular?: boolean;
  features: string[];
}

/** PW-style course-detail content, derived from a Course for the Explore page. */
export interface CourseDetail {
  audience: string;
  startsOn: string;
  endsOn: string;
  plans: CoursePlan[];
  features: string[];
  about: {
    duration: string[];
    validity: string;
    mode: string;
    schedule: string;
    subjects: string;
    extras: string[];
  };
  schedule: { subject: string; teacher: string; lectures: number; plannerUrl?: string }[];
  teachers: { name: string; subject: string; exp: string; avatar: string }[];
  freeContent: { title: string; kind: string }[];
  moreDetails: string[];
}

export interface ExamCategory {
  id: string;
  name: string;
  icon: string; // emoji / glyph
  tracks: string[];
  accent: string; // tailwind gradient classes
}

/* ─── Blog types ────────────────────────────────────────────── */

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  subject: string;
  featuredImage: string | null;
  tags: string[];
  published: boolean;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorInstructorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Admin management types ────────────────────────────────── */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "instructor" | "admin" | "superadmin";
  isDisabled: boolean;
  createdAt: string;
  enrollmentCount: number;
}

export interface AdminInstructor {
  id: string;
  userId?: string;
  name: string;
  title: string;
  email: string;
  isDisabled: boolean;
  courseCount: number;
  adminId?: string | null;
  adminName?: string | null;
}

/** Admin accounts listed for the superadmin (managed, enable/disable). */
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin";
  isDisabled: boolean;
  createdAt: string;
  instructorCount: number;
}

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  disabled: boolean;
  instructorName: string;
  enrollmentCount: number;
  createdAt: string;
}
