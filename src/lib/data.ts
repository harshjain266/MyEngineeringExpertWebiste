import "server-only";

import type { Prisma } from "@prisma/client";
import type { Program as DbProgram } from "@prisma/client";
import * as mock from "@/lib/mock-data";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { PROGRAMS, PROGRAM_BY_SLUG } from "@/config/programs";
import type { 
  Course, EnrolledCourse, LiveClass, LearningStats, Program, Announcement,
  AdminUser, AdminInstructor, AdminCourse, AdminAccount, User 
} from "@/types";

/**
 * Data-access layer.
 *
 * Every screen reads through these functions, never from fixtures or Prisma
 * directly. While `USE_MOCK_DATA !== "false"` they return typed mock data;
 * flip the env flag and reimplement each body against Prisma + Redis
 * (via `cached(...)`) without touching any component.
 */

const USE_MOCK = false; // Forced to false as per user request

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
      liveClasses: [],
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

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const [liveClasses, recommended, announcements] = await Promise.all([
    prisma.liveClass.findMany({
      where: {
        courseId: null,
        startsAt: {
          gte: now,
          lte: nextWeek,
        },
      },
      include: { instructor: true },
      orderBy: { startsAt: 'asc' },
      take: 7 // Max 7 as per request
    }),
    prisma.course.findMany({
      where: {
        id: { notIn: enrolled.map(e => e.course.id) },
        popular: true,
        disabled: false
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
    liveClasses: liveClasses.map((lc: Record<string, unknown>) => ({
      ...lc,
      startsAt: (lc as any).startsAt.toISOString(),
      endsAt: (lc as any).endsAt.toISOString(),
      status: (lc as any).status as any
    })) as unknown as LiveClass[],
    announcements: announcements.map((a: Record<string, unknown>) => ({
      ...a,
      date: (a as any).date.toISOString().split('T')[0],
      tone: (a as any).tone as any
    })) as unknown as Announcement[],
  };
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
    where: { disabled: false },
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

export async function getCoursesByProgram(programSlug: string): Promise<Course[]> {
  const dbCourses = await prisma.course.findMany({
    where: { program: programSlug as DbProgram, disabled: false },
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

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
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

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const dbLiveClasses = await prisma.liveClass.findMany({
    where: {
      courseId: courseId,
      startsAt: {
        gte: now,
        lte: nextWeek,
      },
    },
    include: { instructor: true },
    orderBy: { startsAt: 'asc' },
    take: 7
  });

  return dbLiveClasses.map((lc: Record<string, unknown>) => ({
    ...lc,
    startsAt: (lc as any).startsAt.toISOString(),
    endsAt: (lc as any).endsAt.toISOString(),
    status: (lc as any).status as any
  })) as unknown as LiveClass[];
}

export async function getAllLiveClasses(): Promise<LiveClass[]> {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const dbLiveClasses = await prisma.liveClass.findMany({
    where: {
      courseId: null,
      startsAt: {
        gte: now,
        lte: nextWeek,
      },
    },
    include: { instructor: true },
    orderBy: { startsAt: "asc" },
    take: 7
  });

  return dbLiveClasses.map((lc: Record<string, unknown>) => ({
    ...lc,
    startsAt: (lc as any).startsAt.toISOString(),
    endsAt: (lc as any).endsAt.toISOString(),
    status: (lc as any).status as any,
  })) as unknown as LiveClass[];
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
