import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { PROGRAMS, PROGRAM_BY_SLUG } from "@/config/programs";
import type { 
  Course, EnrolledCourse, LiveClass, LearningStats, Program, Announcement,
  AdminUser, AdminInstructor, AdminCourse, AdminAccount, AdminLiveClass, User,
  PendingCourse, PendingLiveClass, PendingBlog, StudyMaterial, AppNotification
} from "@/types";

/**
 * Data-access layer.
 *
 * Every screen reads through these functions, never from fixtures or Prisma
 * directly.
 */

/**
 * The only courses a student may ever see: enabled *and* signed off by the
 * superadmin. Spread this into every student-facing course query.
 */
export const PUBLIC_COURSE_FILTER = {
  disabled: false,
  approvalStatus: "approved",
} as const satisfies Prisma.CourseWhereInput;

/** Live classes are likewise hidden until the superadmin approves them. */
export const PUBLIC_LIVE_CLASS_FILTER = {
  approvalStatus: "approved",
} as const satisfies Prisma.LiveClassWhereInput;

/**
 * The window a student should still see a class in.
 *
 * Note the `endsAt` bound rather than `startsAt`: a session that began ten
 * minutes ago is exactly the one a student needs to join, so filtering on
 * "starts in the future" would hide every class the moment it went live.
 * Anything explicitly marked Live/Ongoing is always included.
 */
export function liveClassWindow(days = 7): Prisma.LiveClassWhereInput {
  const now = new Date();
  const until = new Date();
  until.setDate(now.getDate() + days);

  return {
    ...PUBLIC_LIVE_CLASS_FILTER,
    OR: [
      { endsAt: { gte: now }, startsAt: { lte: until } },
      { status: { in: ["Live", "Ongoing"] } },
    ],
  };
}

/** Shape a Prisma live class for the UI, with the master-class flag derived. */
function toLiveClass(lc: {
  startsAt: Date;
  endsAt: Date;
  courseId: string | null;
  [key: string]: unknown;
}): LiveClass {
  return {
    ...lc,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    // A class with no course is open to every student — that is a master class.
    isMasterClass: lc.courseId === null,
  } as unknown as LiveClass;
}

/** Blogs need both the author's publish action and the admin's approval. */
export const PUBLIC_BLOG_FILTER = {
  published: true,
  approvalStatus: "approved",
} as const satisfies Prisma.BlogWhereInput;

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: { 
              instructor: true,
              _count: {
                select: { enrollments: true }
              }
            }
          }
        }
      }
    }
  });

  if (!dbUser) {
    return {
      stats: {
        enrolledCourses: 0,
        averageProgress: 0,
        certificatesEarned: 0,
        hoursLearned: 0,
        lessonsCompleted: 0,
        lessonsTotal: 0,
        quizzesAttempted: 0,
        quizzesTotal: 0,
        averageScore: 0,
        overallProgress: 0,
      },
      enrolled: [],
      recommended: [],
      masterClasses: [],
      batchClasses: [],
      announcements: [],
    };
  }

  // Map enrollments to EnrolledCourse type
  const enrolled: EnrolledCourse[] = dbUser.enrollments.map((e: { progress: number; lastAccessed: Date; course: { id: string; slug: string; title: string; category: string; level: string; price: number; originalPrice: number; rating: number; ratingCount: number; durationHours: number; lectures: number; language: string; thumbnail: string | null; badge: string | null; tags: string[]; program: string; plannerUrl: string | null; popular: boolean; instructor: { id: string; name: string; title: string | null; avatar: string | null; bio: string | null }; _count: { enrollments: number } } }) => ({
    course: {
      ...e.course,
      instructor: e.course.instructor,
      enrollmentCount: (e.course as any)._count?.enrollments || 0,
    } as unknown as Course,
    progress: e.progress,
    lastAccessed: e.lastAccessed.toISOString(),
  }));

  const stats: LearningStats = {
    enrolledCourses: enrolled.length,
    overallProgress: enrolled.length > 0 
      ? Math.round(enrolled.reduce((acc, curr) => acc + curr.progress, 0) / enrolled.length)
      : 0,
    averageProgress: enrolled.length > 0 
      ? Math.round(enrolled.reduce((acc, curr) => acc + curr.progress, 0) / enrolled.length)
      : 0,
    certificatesEarned: 0,
    hoursLearned: 0,
    lessonsCompleted: 0,
    lessonsTotal: 0,
    quizzesAttempted: 0,
    quizzesTotal: 0,
    averageScore: 0,
  };

  const enrolledIds = enrolled.map((e) => e.course.id);

  const [masterClasses, batchClasses, recommended, announcements] = await Promise.all([
    // Free for everyone, no course attached.
    prisma.liveClass.findMany({
      where: { ...liveClassWindow(), courseId: null },
      include: { instructor: true },
      orderBy: { startsAt: 'asc' },
      take: 7
    }),
    // The student's own purchased-batch classes.
    enrolledIds.length === 0
      ? Promise.resolve([])
      : prisma.liveClass.findMany({
          where: { ...liveClassWindow(), courseId: { in: enrolledIds } },
          include: { instructor: true, course: { select: { title: true, slug: true } } },
          orderBy: { startsAt: 'asc' },
          take: 7
        }),
    prisma.course.findMany({
      where: {
        ...PUBLIC_COURSE_FILTER,
        id: { notIn: enrolledIds },
        popular: true,
      },
      include: { 
        instructor: true,
        _count: {
          select: { enrollments: true }
        }
      },
      take: 6
    }),
    prisma.announcement.findMany({
      orderBy: { date: 'desc' },
      take: 3
    })
  ]);

  return {
    stats,
    enrolled,
    recommended: recommended.map((c: Record<string, unknown>) => ({
      ...c,
      enrollmentCount: (c as any)._count?.enrollments || 0
    })) as unknown as Course[],
    masterClasses: masterClasses.map(toLiveClass),
    batchClasses: batchClasses.map(toLiveClass),
    announcements: announcements.map((a: Record<string, unknown>) => ({
      ...a,
      date: (a as any).date.toISOString().split('T')[0],
      tone: (a as any).tone as any
    })) as unknown as Announcement[],
  };
}

export async function getUserOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return orders.map((o) => ({
    id: o.id,
    course: o.course,
    courseId: o.courseId,
    amount: o.amount,
    status: o.status,
    planName: o.planName,
    razorpayOrderId: o.razorpayOrderId,
    razorpayPaymentId: o.razorpayPaymentId,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getCourses(): Promise<Course[]> {
  const user = await getCurrentUser();
  const enrolledCourseIds = new Set<string>();

  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    enrollments.forEach((enrollment: { courseId: string }) => enrolledCourseIds.add(enrollment.courseId));
  }

  const dbCourses = await prisma.course.findMany({
    where: PUBLIC_COURSE_FILTER,
    include: {
      instructor: true,
      _count: {
        select: { enrollments: true }
      }
    }
  });

  return dbCourses.map((c: Record<string, unknown>) => ({
    ...c,
    enrollmentCount: (c as any)._count?.enrollments || 0,
    isEnrolled: enrolledCourseIds.has((c as any).id),
  })) as unknown as Course[];
}

export async function getPrograms(): Promise<Program[]> {
  return PROGRAMS;
}

export async function getProgramBySlug(slug: string): Promise<Program | undefined> {
  return PROGRAM_BY_SLUG[slug];
}

type DbProgram = "btech_bca" | "dsa" | "aptitude" | "gate" | "web_dev";

export async function getCoursesByProgram(programSlug: string): Promise<Course[]> {
  const dbCourses = await prisma.course.findMany({
    where: { ...PUBLIC_COURSE_FILTER, program: programSlug as DbProgram },
    include: { 
      instructor: true,
      _count: {
        select: { enrollments: true }
      }
    },
    orderBy: { ratingCount: "desc" },
  });

  return dbCourses.map((c: Record<string, unknown>) => ({
    ...c,
    enrollmentCount: (c as any)._count?.enrollments || 0
  })) as unknown as Course[];
}

/**
 * @param requireApproved keep `true` for public/marketing surfaces. Pass
 * `false` only where enrollment has already been verified, so a student who
 * paid for a course never loses access if it is later pulled from the catalogue.
 */
export async function getCourseBySlug(
  slug: string,
  requireApproved = true,
): Promise<Course | undefined> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: true,
      _count: {
        select: { enrollments: true }
      }
    }
  });

  if (!course) return undefined;
  if (requireApproved && (course.disabled || course.approvalStatus !== "approved")) {
    return undefined;
  }

  return {
    ...course,
    enrollmentCount: (course as any)._count?.enrollments || 0
  } as unknown as Course;
}

export async function isEnrolled(courseId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  return !!enrollment;
}

export async function getLiveClassesByCourse(courseId: string): Promise<LiveClass[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  if (!enrollment) throw new Error("Not enrolled in this course");

  const dbLiveClasses = await prisma.liveClass.findMany({
    where: { ...liveClassWindow(), courseId },
    include: { instructor: true },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  return dbLiveClasses.map(toLiveClass);
}

/**
 * Master classes: sessions with no course attached, free and visible to every
 * signed-in student. The paid, course-linked sessions live in
 * `getMyBatchLiveClasses` / `getLiveClassesByCourse`.
 */
export async function getAllLiveClasses(): Promise<LiveClass[]> {
  const dbLiveClasses = await prisma.liveClass.findMany({
    where: { ...liveClassWindow(), courseId: null },
    include: { instructor: true },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  return dbLiveClasses.map(toLiveClass);
}

/** Every upcoming/ongoing class across the courses this student has bought. */
export async function getMyBatchLiveClasses(): Promise<LiveClass[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  });
  if (enrollments.length === 0) return [];

  const dbLiveClasses = await prisma.liveClass.findMany({
    where: {
      ...liveClassWindow(),
      courseId: { in: enrollments.map((e) => e.courseId) },
    },
    include: { instructor: true, course: { select: { title: true, slug: true } } },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  return dbLiveClasses.map(toLiveClass);
}

export async function getOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const dbOrders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return dbOrders.map((o: Record<string, unknown>) => ({
    id: (o as any).id,
    date: (o as any).createdAt.toISOString().split('T')[0],
    course: (o as any).course,
    amount: (o as any).amount,
    status: (o as any).status as any
  }));
}

/* ─── Admin queries ─────────────────────────────────────────── */

/**
 * Scope builders for the admin area.
 *
 * - superadmin sees the whole platform.
 * - admin sees ALL users and ALL courses platform-wide, but only manages the
 *   teachers assigned to them (`Instructor.adminId === currentUser.id`).
 */
function adminInstructorScope(user: User): Prisma.InstructorWhereInput {
  return isSuperAdmin(user) ? {} : { adminId: user.id };
}

async function adminOrderScope(user: User): Promise<Prisma.OrderWhereInput> {
  if (isSuperAdmin(user)) return { status: "Success" };
  const courseIds = await prisma.course.findMany({
    where: { instructor: { adminId: user.id } },
    select: { id: true },
  });
  return {
    status: "Success",
    courseId: { in: courseIds.map((c) => c.id) },
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const users = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true } },
    },
  });
  return users.map((u: Record<string, unknown>) => ({
    id: (u as any).id,
    name: (u as any).name,
    email: (u as any).email ?? "",
    phone: (u as any).phone ?? "",
    role: (u as any).role,
    isDisabled: (u as any).isDisabled,
    createdAt: (u as any).createdAt.toISOString(),
    enrollmentCount: (u as any)._count.enrollments,
  }));
}

export async function getAdminInstructors(user: User): Promise<AdminInstructor[]> {
  const instructors = await prisma.instructor.findMany({
    where: adminInstructorScope(user),
    orderBy: { name: "asc" },
    include: {
      user: { select: { isDisabled: true, email: true } },
      admin: { select: { name: true } },
      _count: { select: { courses: true } },
    },
  });
  return instructors.map((i: Record<string, unknown>) => ({
    id: (i as any).id,
    userId: (i as any).userId ?? undefined,
    name: (i as any).name,
    title: (i as any).title,
    email: (i as any).user?.email ?? "",
    isDisabled: (i as any).user?.isDisabled ?? false,
    courseCount: (i as any)._count.courses,
    adminId: (i as any).adminId ?? null,
    adminName: (i as any).admin?.name ?? null,
  }));
}

export async function getAdminCourses(): Promise<AdminCourse[]> {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  });
  return courses.map((c: Record<string, unknown>) => ({
    id: (c as any).id,
    slug: (c as any).slug,
    title: (c as any).title,
    category: (c as any).category,
    program: (c as any).program ?? "",
    price: (c as any).price,
    disabled: (c as any).disabled,
    instructorName: (c as any).instructor.name,
    enrollmentCount: (c as any)._count.enrollments,
    createdAt: (c as any).createdAt.toISOString(),
    startsOn: (c as any).startsOn ? (c as any).startsOn.toISOString() : null,
    endsOn: (c as any).endsOn ? (c as any).endsOn.toISOString() : null,
    approvalStatus: (c as any).approvalStatus,
    reviewNote: (c as any).reviewNote ?? null,
  }));
}

/** Live classes scoped to an admin's aligned instructors (all for superadmin). */
export async function getAdminLiveClasses(user: User): Promise<AdminLiveClass[]> {
  const scope = adminInstructorScope(user);
  const liveClasses = await prisma.liveClass.findMany({
    where: {
      instructor: {
        is: {
          ...(Object.keys(scope).length > 0 ? scope : {}),
        },
      },
    },
    orderBy: { startsAt: "desc" },
    include: {
      instructor: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  return liveClasses.map((lc: Record<string, unknown>) => ({
    id: (lc as any).id,
    title: (lc as any).title,
    topic: (lc as any).topic,
    subject: (lc as any).subject ?? null,
    meetingUrl: (lc as any).meetingUrl ?? null,
    startsAt: (lc as any).startsAt.toISOString(),
    endsAt: (lc as any).endsAt.toISOString(),
    status: (lc as any).status as any,
    instructorId: (lc as any).instructorId,
    instructorName: (lc as any).instructor.name,
    courseId: (lc as any).courseId ?? null,
    courseTitle: (lc as any).course?.title ?? null,
    approvalStatus: (lc as any).approvalStatus,
    reviewNote: (lc as any).reviewNote ?? null,
  }));
}

/* ─── Approval queue ────────────────────────────────────────── */

/**
 * Everything waiting on the signed-in reviewer.
 *
 * Courses and live classes surface for the superadmin only; blogs surface for
 * the admin who manages the author's teacher (and for superadmins, who see
 * every blog as a fallback when a teacher has no admin assigned).
 */
export async function getApprovalQueue(user: User) {
  const superadmin = isSuperAdmin(user);

  const blogWhere: Prisma.BlogWhereInput = superadmin
    ? {}
    : { author: { instructor: { adminId: user.id } } };

  const [courses, liveClasses, blogs] = await Promise.all([
    superadmin
      ? prisma.course.findMany({
          orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
          include: {
            instructor: { select: { name: true } },
            submittedBy: { select: { name: true } },
            reviewedBy: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    superadmin
      ? prisma.liveClass.findMany({
          orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
          include: {
            instructor: { select: { name: true } },
            course: { select: { title: true } },
            submittedBy: { select: { name: true } },
            reviewedBy: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    prisma.blog.findMany({
      where: blogWhere,
      orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      include: {
        author: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
  ]);

  const pendingCourses: PendingCourse[] = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    program: c.program,
    level: c.level,
    price: c.price,
    originalPrice: c.originalPrice,
    durationHours: c.durationHours,
    lectures: c.lectures,
    language: c.language,
    thumbnail: c.thumbnail,
    badge: c.badge,
    startsOn: c.startsOn?.toISOString() ?? null,
    endsOn: c.endsOn?.toISOString() ?? null,
    instructorName: c.instructor.name,
    createdAt: c.createdAt.toISOString(),
    approvalStatus: c.approvalStatus,
    reviewNote: c.reviewNote,
    reviewedAt: c.reviewedAt?.toISOString() ?? null,
    reviewerName: c.reviewedBy?.name ?? null,
    submittedByName: c.submittedBy?.name ?? null,
  }));

  const pendingLiveClasses: PendingLiveClass[] = liveClasses.map((lc) => ({
    id: lc.id,
    title: lc.title,
    topic: lc.topic,
    subject: lc.subject,
    meetingUrl: lc.meetingUrl,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    instructorName: lc.instructor.name,
    courseTitle: lc.course?.title ?? null,
    createdAt: lc.createdAt.toISOString(),
    approvalStatus: lc.approvalStatus,
    reviewNote: lc.reviewNote,
    reviewedAt: lc.reviewedAt?.toISOString() ?? null,
    reviewerName: lc.reviewedBy?.name ?? null,
    submittedByName: lc.submittedBy?.name ?? null,
  }));

  const pendingBlogs: PendingBlog[] = blogs.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    subject: b.subject,
    excerpt: b.excerpt,
    content: b.content,
    tags: b.tags,
    featuredImage: b.featuredImage,
    featured: b.featured,
    readMinutes: b.readMinutes,
    authorName: b.author.name,
    createdAt: b.createdAt.toISOString(),
    approvalStatus: b.approvalStatus,
    reviewNote: b.reviewNote,
    reviewedAt: b.reviewedAt?.toISOString() ?? null,
    reviewerName: b.reviewedBy?.name ?? null,
    submittedByName: b.author.name,
  }));

  const pendingOnly = <T extends { approvalStatus: string }>(rows: T[]) =>
    rows.filter((r) => r.approvalStatus === "pending").length;

  return {
    courses: pendingCourses,
    liveClasses: pendingLiveClasses,
    blogs: pendingBlogs,
    counts: {
      courses: pendingOnly(pendingCourses),
      liveClasses: pendingOnly(pendingLiveClasses),
      blogs: pendingOnly(pendingBlogs),
    },
  };
}

/** Pending-approval badge count for the sidebar. */
export async function getPendingApprovalCount(user: User): Promise<number> {
  if (isSuperAdmin(user)) {
    const [courses, liveClasses, blogs] = await Promise.all([
      prisma.course.count({ where: { approvalStatus: "pending" } }),
      prisma.liveClass.count({ where: { approvalStatus: "pending" } }),
      prisma.blog.count({ where: { approvalStatus: "pending" } }),
    ]);
    return courses + liveClasses + blogs;
  }

  return prisma.blog.count({
    where: {
      approvalStatus: "pending",
      author: { instructor: { adminId: user.id } },
    },
  });
}

/* ─── Study material ────────────────────────────────────────── */

/** Materials for a course the signed-in student actually bought. */
export async function getCourseMaterialsForStudent(
  courseId: string,
): Promise<StudyMaterial[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true },
  });
  if (!enrollment) throw new Error("Not enrolled in this course");

  return listCourseMaterials(courseId);
}

/**
 * Every material across every course this student has bought, for the
 * dedicated Study Material page. Returns the enrolled-course list alongside it
 * so the page can render its course filter without a second round trip.
 */
export async function getMyStudyMaterials(): Promise<{
  materials: StudyMaterial[];
  courses: { id: string; title: string; slug: string }[];
}> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    select: { course: { select: { id: true, title: true, slug: true } } },
    orderBy: { lastAccessed: "desc" },
  });

  const courses = enrollments.map((e) => e.course);
  if (courses.length === 0) return { materials: [], courses: [] };

  const materials = await prisma.studyMaterial.findMany({
    where: { courseId: { in: courses.map((c) => c.id) } },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true } },
      course: { select: { title: true, slug: true } },
    },
  });

  return {
    courses,
    materials: materials.map((m) => ({
      id: m.id,
      courseId: m.courseId,
      courseTitle: m.course.title,
      courseSlug: m.course.slug,
      title: m.title,
      description: m.description,
      kind: m.kind,
      url: m.url,
      fileName: m.fileName,
      fileSize: m.fileSize,
      mimeType: m.mimeType,
      uploadedByName: m.uploadedBy.name,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

/** Raw material list — callers must have already authorised access. */
export async function listCourseMaterials(courseId: string): Promise<StudyMaterial[]> {
  const materials = await prisma.studyMaterial.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return materials.map((m) => ({
    id: m.id,
    courseId: m.courseId,
    title: m.title,
    description: m.description,
    kind: m.kind,
    url: m.url,
    fileName: m.fileName,
    fileSize: m.fileSize,
    mimeType: m.mimeType,
    uploadedByName: m.uploadedBy.name,
    createdAt: m.createdAt.toISOString(),
  }));
}

/** Admin accounts (role=admin) for the superadmin to manage. */
export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { managedInstructors: true } } },
  });
  return admins.map((a: Record<string, unknown>) => ({
    id: (a as any).id,
    name: (a as any).name,
    email: (a as any).email ?? "",
    phone: (a as any).phone ?? "",
    role: "admin" as const,
    isDisabled: (a as any).isDisabled,
    createdAt: (a as any).createdAt.toISOString(),
    instructorCount: (a as any)._count.managedInstructors,
  }));
}

export interface AdminStats {
  totalUsers: number;
  totalInstructors: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
}

export async function getAdminStats(user: User): Promise<AdminStats> {
  const [totalUsers, totalInstructors, totalCourses, orderAgg] = await Promise.all([
    prisma.user.count({ where: { role: "student" } }),
    prisma.instructor.count({ where: adminInstructorScope(user) }),
    prisma.course.count(),
    prisma.order.aggregate({
      where: await adminOrderScope(user),
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalUsers,
    totalInstructors,
    totalCourses,
    totalOrders: orderAgg._count,
    totalRevenue: orderAgg._sum.amount || 0,
  };
}

export async function getAdminMonthlyRevenue(user: User) {
  const orders = await prisma.order.findMany({
    where: await adminOrderScope(user),
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyMap: Record<string, number> = {};
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] || 0) + order.amount;
  }
  return Object.entries(monthlyMap)
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-6);
}

export async function getAdminRecentOrders(user: User, take = 5) {
  const orders = await prisma.order.findMany({
    where: await adminOrderScope(user),
    orderBy: { createdAt: "desc" },
    take,
    include: { user: true },
  });
  return orders.map((o: Record<string, unknown>) => ({
    id: (o as any).id,
    course: (o as any).course,
    amount: (o as any).amount,
    createdAt: (o as any).createdAt.toISOString(),
    userName: (o as any).user.name,
    userEmail: (o as any).user.email,
  }));
}

export async function getAdminAllOrders(user: User) {
  const orders = await prisma.order.findMany({
    where: await adminOrderScope(user),
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return orders.map((o) => ({
    id: o.id,
    course: o.course,
    courseId: o.courseId,
    amount: o.amount,
    status: o.status,
    planName: o.planName,
    razorpayOrderId: o.razorpayOrderId,
    razorpayPaymentId: o.razorpayPaymentId,
    createdAt: o.createdAt.toISOString(),
    userName: o.user.name,
    userEmail: o.user.email,
  }));
}

export async function getAdminRecentUsers(take = 5) {
  const users = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: { createdAt: "desc" },
    take,
  });
  return users.map((u: Record<string, unknown>) => ({
    id: (u as any).id,
    name: (u as any).name,
    email: (u as any).email ?? null,
    createdAt: (u as any).createdAt.toISOString(),
  }));
}

/* ─── Notifications ─────────────────────────────────────────── */

/** Unread count for the topbar bell and the sidebar badge. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * A page of this user's notifications, newest first.
 *
 * `take` is one more than the caller asked for so the page can tell whether a
 * "load more" cursor exists without a second count query.
 */
export async function getNotifications(
  userId: string,
  { take = 50 }: { take?: number } = {},
): Promise<{ items: AppNotification[]; unread: number }> {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    getUnreadNotificationCount(userId),
  ]);

  return {
    unread,
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      read: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}
