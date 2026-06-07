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

const USE_MOCK = process.env.USE_MOCK_DATA !== "false";

export async function getDashboardData() {
  if (USE_MOCK) {
    return {
      stats: mock.learningStats,
      enrolled: mock.enrolledCourses,
      recommended: mock.recommendedCourses,
      liveClasses: mock.liveClasses,
      announcements: mock.announcements,
    };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: { instructor: true }
          }
        }
      }
    }
  });

  if (!dbUser) {
    throw new Error("User not found in database");
  }

  // Map enrollments to EnrolledCourse type
  const enrolled: EnrolledCourse[] = dbUser.enrollments.map(e => ({
    course: {
      ...e.course,
      instructor: e.course.instructor,
    } as Course,
    progress: e.progress,
    lastAccessed: e.lastAccessed.toISOString(),
  }));

  // Simple stats for now, can be expanded
  const stats: LearningStats = {
    ...mock.learningStats, // Fallback for fields not yet in DB
    enrolledCourses: enrolled.length,
    overallProgress: enrolled.length > 0 
      ? Math.round(enrolled.reduce((acc, curr) => acc + curr.progress, 0) / enrolled.length)
      : 0,
  };

  const [liveClasses, recommended, announcements] = await Promise.all([
    prisma.liveClass.findMany({
      include: { instructor: true },
      orderBy: { startsAt: 'asc' },
      take: 4
    }),
    prisma.course.findMany({
      where: {
        id: { notIn: enrolled.map(e => e.course.id) },
        popular: true
      },
      include: { instructor: true },
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
    recommended: recommended as Course[],
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
  if (USE_MOCK) return mock.courses;
  
  const dbCourses = await prisma.course.findMany({
    include: { instructor: true }
  });
  
  return dbCourses as Course[];
}

export async function getPrograms(): Promise<Program[]> {
  return PROGRAMS;
}

export async function getProgramBySlug(slug: string): Promise<Program | undefined> {
  return PROGRAM_BY_SLUG[slug];
}

export async function getCoursesByProgram(programSlug: string): Promise<Course[]> {
  if (USE_MOCK) return mock.courses.filter((c) => c.program === programSlug);

  const dbCourses = await prisma.course.findMany({
    where: { program: programSlug },
    include: { instructor: true },
    orderBy: { ratingCount: "desc" },
  });

  return dbCourses as unknown as Course[];
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  if (USE_MOCK) return mock.courseBySlug(slug);
  
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { instructor: true }
  });
  
  return (course as Course) || undefined;
}

export async function getAllLiveClasses(): Promise<LiveClass[]> {
  if (USE_MOCK) {
    return mock.liveClasses;
  }

  const dbLiveClasses = await prisma.liveClass.findMany({
    include: { instructor: true },
    orderBy: { startsAt: "asc" },
  });

  return dbLiveClasses.map((lc) => ({
    ...lc,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    status: lc.status as any,
  })) as LiveClass[];
}

export async function getOrders() {
  if (USE_MOCK) return mock.orders;
  
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
