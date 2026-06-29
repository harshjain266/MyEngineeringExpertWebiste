import "server-only";

import * as mock from "@/lib/mock-data";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PROGRAMS, PROGRAM_BY_SLUG } from "@/config/programs";
import type { Course, EnrolledCourse, LiveClass, LearningStats, Program } from "@/types";

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
  const enrolled: EnrolledCourse[] = dbUser.enrollments.map(e => ({
    course: {
      ...e.course,
      instructor: e.course.instructor,
      enrollmentCount: (e.course as any)._count?.enrollments || 0,
    } as Course,
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

  const enrolledCourseIds = enrolled.map((e) => e.course.id);

  // Filter live classes for next 7 days
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const [liveClasses, recommended, announcements] = await Promise.all([
    prisma.liveClass.findMany({
      where: {
        AND: [
          {
            OR: [
              { courseId: null },
              { courseId: { in: enrolledCourseIds } },
            ],
          },
          {
            startsAt: {
              gte: now,
              lte: nextWeek,
            },
          },
        ],
      },
      include: { instructor: true },
      orderBy: { startsAt: 'asc' },
      take: 7 // Max 7 as per request
    }),
    prisma.course.findMany({
      where: {
        id: { notIn: enrolled.map(e => e.course.id) },
        popular: true
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
    recommended: recommended.map(c => ({
      ...c,
      enrollmentCount: (c as any)._count?.enrollments || 0
    })) as Course[],
    liveClasses: liveClasses.map(lc => ({
      ...lc,
      startsAt: lc.startsAt.toISOString(),
      endsAt: lc.endsAt.toISOString(),
      status: lc.status as any
    })) as LiveClass[],
    announcements: announcements.map(a => ({
      ...a,
      date: a.date.toISOString().split('T')[0],
      tone: a.tone as any
    })),
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
    enrollments.forEach((enrollment) => enrolledCourseIds.add(enrollment.courseId));
  }

  const dbCourses = await prisma.course.findMany({
    include: { 
      instructor: true,
      _count: {
        select: { enrollments: true }
      }
    }
  });

  return dbCourses.map(c => ({
    ...c,
    enrollmentCount: (c as any)._count?.enrollments || 0,
    isEnrolled: enrolledCourseIds.has(c.id),
  })) as Course[];
}

export async function getPrograms(): Promise<Program[]> {
  return PROGRAMS;
}

export async function getProgramBySlug(slug: string): Promise<Program | undefined> {
  return PROGRAM_BY_SLUG[slug];
}

export async function getCoursesByProgram(programSlug: string): Promise<Course[]> {
  const dbCourses = await prisma.course.findMany({
    where: { program: programSlug },
    include: { 
      instructor: true,
      _count: {
        select: { enrollments: true }
      }
    },
    orderBy: { ratingCount: "desc" },
  });

  return dbCourses.map(c => ({
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
  } as Course;
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

  return dbLiveClasses.map(lc => ({
    ...lc,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    status: lc.status as any
  })) as LiveClass[];
}

export async function getAllLiveClasses(): Promise<LiveClass[]> {
  const user = await getCurrentUser();

  // Build course filter: show general classes (courseId=null) + classes for enrolled courses
  let courseFilter: object = { courseId: null };
  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    courseFilter = {
      OR: [
        { courseId: null },
        { courseId: { in: enrolledCourseIds } },
      ],
    };
  }

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const dbLiveClasses = await prisma.liveClass.findMany({
    where: {
      ...courseFilter as any,
      startsAt: {
        gte: now,
        lte: nextWeek,
      },
    },
    include: { instructor: true },
    orderBy: { startsAt: "asc" },
    take: 7
  });

  return dbLiveClasses.map((lc) => ({
    ...lc,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    status: lc.status as any,
  })) as LiveClass[];
}

export async function getOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const dbOrders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return dbOrders.map(o => ({
    id: o.id,
    date: o.createdAt.toISOString().split('T')[0],
    course: o.course,
    amount: o.amount,
    status: o.status as any
  }));
}
