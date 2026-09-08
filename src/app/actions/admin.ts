"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { notifyCourseSubmitted, notifyLiveClassSubmitted } from "@/lib/notify";
import { announceLiveClass, announceSubmission } from "@/lib/notifications";

type Level = "Beginner" | "Intermediate" | "Advanced";
type Program = "btech_bca" | "dsa" | "aptitude" | "gate" | "web_dev";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Ensure the actor can assign an instructor (their own aligned teacher, or any if superadmin). */
async function assertCanManageInstructor(instructorId: string) {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { id: true, adminId: true },
  });
  if (!instructor) {
    throw new Error("Selected teacher was not found.");
  }
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized.");
  if (!isSuperAdmin(user) && instructor.adminId !== user.id) {
    throw new Error("You can only create content for teachers assigned to you.");
  }
  return instructor;
}

export interface CreateCourseInput {
  title: string;
  category: string;
  level: Level;
  price: number;
  originalPrice: number;
  durationHours: number;
  lectures: number;
  language: string;
  program: Program;
  startsOn?: string;
  endsOn?: string;
  thumbnail?: string;
  badge?: string;
  instructorId: string;
}

export async function createCourse(input: CreateCourseInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in as an admin." };
    }

    await assertCanManageInstructor(input.instructorId);

    if (!input.title || !input.title.trim()) {
      return { success: false, error: "Course title is required." };
    }
    if (input.price < 0 || input.originalPrice < 0 || input.price > input.originalPrice && input.originalPrice > 0) {
      return { success: false, error: "Price must be lower than or equal to the original price." };
    }

    const baseSlug = slugify(input.title);
    const slug = `${baseSlug || "course"}-${Date.now().toString(36)}`;

    // A superadmin is the approver, so anything they create is already approved.
    const autoApprove = isSuperAdmin(user);

    const course = await prisma.course.create({
      data: {
        slug,
        title: input.title.trim(),
        category: input.category || "Computer Science",
        level: input.level,
        price: Math.round(input.price),
        originalPrice: Math.round(Math.max(input.originalPrice, input.price)),
        durationHours: input.durationHours || 1,
        lectures: input.lectures || 1,
        language: input.language || "English",
        program: input.program,
        startsOn: input.startsOn ? new Date(input.startsOn) : null,
        endsOn: input.endsOn ? new Date(input.endsOn) : null,
        thumbnail: input.thumbnail || null,
        badge: input.badge || null,
        disabled: false,
        instructorId: input.instructorId,
        submittedById: user.id,
        approvalStatus: autoApprove ? "approved" : "pending",
        reviewedById: autoApprove ? user.id : null,
        reviewedAt: autoApprove ? new Date() : null,
      },
      include: { instructor: { select: { name: true } } },
    });

    if (!autoApprove) {
      await Promise.all([
        notifyCourseSubmitted({
          id: course.id,
          title: course.title,
          price: course.price,
          program: course.program,
          category: course.category,
          startsOn: course.startsOn,
          instructorName: course.instructor.name,
          submittedByName: user.name,
        }),
        announceSubmission({
          kind: "Course",
          id: course.id,
          title: course.title,
          submittedBy: user.name,
        }),
      ]);
    }

    revalidatePath("/admin/courses");
    revalidatePath("/admin/approvals");
    revalidatePath("/admin");
    revalidatePath("/dashboard/browse");
    revalidatePath("/dashboard/my-courses");

    return {
      success: true,
      pendingApproval: !autoApprove,
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
      },
    };
  } catch (err) {
    console.error("createCourse error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not create course. Please try again.",
    };
  }
}

export interface CreateLiveClassInput {
  title: string;
  topic: string;
  subject?: string;
  meetingUrl?: string;
  startsAt: string;
  endsAt: string;
  instructorId: string;
  courseId?: string;
}

export async function createLiveClass(input: CreateLiveClassInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in as an admin." };
    }

    await assertCanManageInstructor(input.instructorId);

    if (!input.title || !input.title.trim()) {
      return { success: false, error: "Class title is required." };
    }
    if (!input.topic || !input.topic.trim()) {
      return { success: false, error: "Class topic is required." };
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return { success: false, error: "Please provide valid start and end times." };
    }
    if (endsAt <= startsAt) {
      return { success: false, error: "End time must be after the start time." };
    }

    let course: { id: string; title: string } | null = null;
    if (input.courseId) {
      const found = await prisma.course.findUnique({ where: { id: input.courseId } });
      if (!found) {
        return { success: false, error: "The linked course was not found." };
      }
      if (found.instructorId !== input.instructorId) {
        return { success: false, error: "The live class can only be linked to a course taught by the selected teacher." };
      }
      course = found;
    }

    const autoApprove = isSuperAdmin(user);

    const liveClass = await prisma.liveClass.create({
      data: {
        title: input.title.trim(),
        topic: input.topic.trim(),
        subject: input.subject || null,
        meetingUrl: input.meetingUrl || null,
        startsAt,
        endsAt,
        instructorId: input.instructorId,
        courseId: course?.id ?? null,
        status: "Upcoming",
        submittedById: user.id,
        approvalStatus: autoApprove ? "approved" : "pending",
        reviewedById: autoApprove ? user.id : null,
        reviewedAt: autoApprove ? new Date() : null,
      },
      include: { instructor: { select: { name: true } } },
    });

    if (autoApprove) {
      // A superadmin's class is already live, so students hear about it now.
      await announceLiveClass(liveClass.id);
    } else {
      await Promise.all([
        notifyLiveClassSubmitted({
          id: liveClass.id,
          title: liveClass.title,
          topic: liveClass.topic,
          startsAt: liveClass.startsAt,
          courseTitle: course?.title ?? null,
          instructorName: liveClass.instructor.name,
          submittedByName: user.name,
        }),
        announceSubmission({
          kind: "Live class",
          id: liveClass.id,
          title: liveClass.title,
          submittedBy: user.name,
        }),
      ]);
    }

    revalidatePath("/admin/live-classes");
    revalidatePath("/admin/master-classes");
    revalidatePath("/admin/approvals");
    revalidatePath("/instructor/batches");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/live-classes");

    return { success: true, id: liveClass.id, pendingApproval: !autoApprove };
  } catch (err) {
    console.error("createLiveClass error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not create live class. Please try again.",
    };
  }
}

export interface CreateMasterClassInput {
  title: string;
  topic: string;
  subject?: string;
  meetingUrl?: string;
  startsAt: string;
  endsAt: string;
  instructorId: string;
}

/**
 * Schedule a free master class.
 *
 * A master class is simply a live class with no course attached — that is what
 * makes it visible to every student instead of one batch — so this delegates to
 * `createLiveClass` and only guarantees the course link stays empty.
 */
export async function createMasterClass(input: CreateMasterClassInput) {
  return createLiveClass({ ...input, courseId: undefined });
}

/** Cancel a scheduled master class. Completed sessions stay on the record. */
export async function cancelMasterClass(liveClassId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in as an admin." };
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      select: { id: true, courseId: true, status: true, instructorId: true },
    });

    if (!liveClass || liveClass.courseId !== null) {
      return { success: false, error: "Master class not found." };
    }

    await assertCanManageInstructor(liveClass.instructorId);

    if (liveClass.status === "Completed") {
      return { success: false, error: "A completed master class cannot be cancelled." };
    }

    await prisma.liveClass.delete({ where: { id: liveClass.id } });

    revalidatePath("/admin/master-classes");
    revalidatePath("/admin/live-classes");
    revalidatePath("/admin/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/live-classes");

    return { success: true };
  } catch (err) {
    console.error("cancelMasterClass error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not cancel the master class.",
    };
  }
}
