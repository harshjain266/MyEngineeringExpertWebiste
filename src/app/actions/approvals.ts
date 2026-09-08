"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, canAccessAdmin } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { notifyDecision } from "@/lib/notify";
import {
  announceBlog,
  announceDecision,
  announceLiveClass,
} from "@/lib/notifications";
import { buildExcerpt, readingMinutes } from "@/lib/blog";
import type { User } from "@/types";

/**
 * Moderation actions for the /admin/approvals queue.
 *
 * - Courses and live classes are reviewed by the superadmin.
 * - Blogs are reviewed by the admin who manages the author's instructor
 *   profile, and by any superadmin as a fallback/override.
 */

type ActionResult = { success: true } | { success: false; error: string };

function fail(error: string): ActionResult {
  return { success: false, error };
}

async function requireSuperAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");
  if (!isSuperAdmin(user)) {
    throw new Error("Only the superadmin can review courses and live classes.");
  }
  return user;
}

async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");
  if (!canAccessAdmin(user)) throw new Error("Admin access required.");
  return user;
}

/** A blog may be reviewed by its author's managing admin, or any superadmin. */
async function assertCanReviewBlog(user: User, blogId: string) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    select: {
      id: true,
      title: true,
      slug: true,
      authorId: true,
      author: {
        select: {
          name: true,
          email: true,
          instructor: { select: { adminId: true } },
        },
      },
    },
  });

  if (!blog) throw new Error("That blog no longer exists.");
  if (isSuperAdmin(user)) return blog;
  if (blog.author.instructor?.adminId !== user.id) {
    throw new Error("You can only review blogs written by teachers assigned to you.");
  }
  return blog;
}

function revalidateCourseSurfaces() {
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/dashboard/browse");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

function revalidateLiveClassSurfaces() {
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/live-classes");
  revalidatePath("/admin/master-classes");
  revalidatePath("/instructor/batches");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/live-classes");
}

function revalidateBlogSurfaces(slug?: string) {
  revalidatePath("/admin/approvals");
  revalidatePath("/instructor/blogs");
  revalidatePath("/blogs");
  if (slug) revalidatePath(`/blogs/${slug}`);
}

/* ─── Courses ───────────────────────────────────────────────── */

export async function reviewCourse(
  courseId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<ActionResult> {
  try {
    const user = await requireSuperAdmin();

    if (decision === "rejected" && !note?.trim()) {
      return fail("Please tell the admin why this course was rejected.");
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        approvalStatus: decision,
        reviewNote: note?.trim() || null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      include: { submittedBy: { select: { email: true } } },
    });

    await Promise.all([
      notifyDecision({
        to: course.submittedBy?.email,
        kind: "Course",
        title: course.title,
        approved: decision === "approved",
        note,
        reviewerName: user.name,
        ctaPath: "/admin/courses",
      }),
      announceDecision({
        kind: "Course",
        id: course.id,
        title: course.title,
        approved: decision === "approved",
        note,
        reviewerName: user.name,
        recipientId: course.submittedById,
        href: "/admin/courses",
      }),
    ]);

    revalidateCourseSurfaces();
    return { success: true };
  } catch (err) {
    console.error("reviewCourse error:", err);
    return fail(err instanceof Error ? err.message : "Could not save that decision.");
  }
}

export interface CourseEditInput {
  title: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  program: "btech_bca" | "dsa" | "aptitude" | "gate" | "web_dev";
  price: number;
  originalPrice: number;
  durationHours: number;
  lectures: number;
  language: string;
  badge?: string;
  thumbnail?: string;
  startsOn?: string;
  endsOn?: string;
}

/** Superadmin fixes a submission in place; saving does not by itself approve it. */
export async function updateCourseFromReview(
  courseId: string,
  input: CourseEditInput,
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    if (!input.title.trim()) return fail("Course title is required.");
    if (input.price < 0 || input.originalPrice < 0) {
      return fail("Prices cannot be negative.");
    }
    if (input.originalPrice > 0 && input.price > input.originalPrice) {
      return fail("Price must be lower than or equal to the original price.");
    }

    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: input.title.trim(),
        category: input.category,
        level: input.level,
        program: input.program,
        price: Math.round(input.price),
        originalPrice: Math.round(Math.max(input.originalPrice, input.price)),
        durationHours: Math.max(1, Math.round(input.durationHours)),
        lectures: Math.max(1, Math.round(input.lectures)),
        language: input.language || "English",
        badge: input.badge?.trim() || null,
        thumbnail: input.thumbnail?.trim() || null,
        startsOn: input.startsOn ? new Date(input.startsOn) : null,
        endsOn: input.endsOn ? new Date(input.endsOn) : null,
      },
    });

    revalidateCourseSurfaces();
    return { success: true };
  } catch (err) {
    console.error("updateCourseFromReview error:", err);
    return fail(err instanceof Error ? err.message : "Could not save those edits.");
  }
}

/* ─── Live classes ──────────────────────────────────────────── */

export async function reviewLiveClass(
  liveClassId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<ActionResult> {
  try {
    const user = await requireSuperAdmin();

    if (decision === "rejected" && !note?.trim()) {
      return fail("Please tell the admin why this live class was rejected.");
    }

    const liveClass = await prisma.liveClass.update({
      where: { id: liveClassId },
      data: {
        approvalStatus: decision,
        reviewNote: note?.trim() || null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      include: { submittedBy: { select: { email: true } } },
    });

    await Promise.all([
      notifyDecision({
        to: liveClass.submittedBy?.email,
        kind: "Live class",
        title: liveClass.title,
        approved: decision === "approved",
        note,
        reviewerName: user.name,
        ctaPath: "/admin/live-classes",
      }),
      announceDecision({
        kind: "Live class",
        id: liveClass.id,
        title: liveClass.title,
        approved: decision === "approved",
        note,
        reviewerName: user.name,
        recipientId: liveClass.submittedById,
        href: "/admin/live-classes",
      }),
      // Students only hear about it once it is actually approved.
      decision === "approved" ? announceLiveClass(liveClass.id) : Promise.resolve(),
    ]);

    revalidateLiveClassSurfaces();
    return { success: true };
  } catch (err) {
    console.error("reviewLiveClass error:", err);
    return fail(err instanceof Error ? err.message : "Could not save that decision.");
  }
}

export interface LiveClassEditInput {
  title: string;
  topic: string;
  subject?: string;
  meetingUrl?: string;
  startsAt: string;
  endsAt: string;
}

export async function updateLiveClassFromReview(
  liveClassId: string,
  input: LiveClassEditInput,
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    if (!input.title.trim()) return fail("Class title is required.");
    if (!input.topic.trim()) return fail("Class topic is required.");

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return fail("Please provide valid start and end times.");
    }
    if (endsAt <= startsAt) return fail("End time must be after the start time.");

    await prisma.liveClass.update({
      where: { id: liveClassId },
      data: {
        title: input.title.trim(),
        topic: input.topic.trim(),
        subject: input.subject?.trim() || null,
        meetingUrl: input.meetingUrl?.trim() || null,
        startsAt,
        endsAt,
      },
    });

    revalidateLiveClassSurfaces();
    return { success: true };
  } catch (err) {
    console.error("updateLiveClassFromReview error:", err);
    return fail(err instanceof Error ? err.message : "Could not save those edits.");
  }
}

/* ─── Blogs ─────────────────────────────────────────────────── */

export async function reviewBlog(
  blogId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const blog = await assertCanReviewBlog(user, blogId);

    if (decision === "rejected" && !note?.trim()) {
      return fail("Please tell the author why this blog was rejected.");
    }

    await prisma.blog.update({
      where: { id: blogId },
      data: {
        approvalStatus: decision,
        reviewNote: note?.trim() || null,
        reviewedById: user.id,
        reviewedAt: new Date(),
        // A rejected post drops back to a draft so the author can rework it.
        ...(decision === "rejected" ? { published: false } : {}),
      },
    });

    const authorPath =
      decision === "approved"
        ? `/blogs/${blog.slug}`
        : `/instructor/blogs/${blog.slug}/edit`;

    await Promise.all([
      notifyDecision({
        to: blog.author.email,
        kind: "Blog",
        title: blog.title,
        approved: decision === "approved",
        note,
        reviewerName: user.name,
        ctaPath: authorPath,
      }),
      announceDecision({
        kind: "Blog",
        id: blog.id,
        title: blog.title,
        approved: decision === "approved",
        note,
        reviewerName: user.name,
        recipientId: blog.authorId,
        href: authorPath,
      }),
      // `announceBlog` re-checks published + approved, so an approved draft
      // stays silent until its author actually publishes it.
      decision === "approved" ? announceBlog(blog.id) : Promise.resolve(),
    ]);

    revalidateBlogSurfaces(blog.slug);
    return { success: true };
  } catch (err) {
    console.error("reviewBlog error:", err);
    return fail(err instanceof Error ? err.message : "Could not save that decision.");
  }
}

export interface BlogEditInput {
  title: string;
  subject: string;
  excerpt?: string;
  tags: string[];
  content: string;
  featuredImage?: string;
  featured?: boolean;
}

/** Reviewer polish pass — headline, teaser, tags, cover, content, spotlight. */
export async function updateBlogFromReview(
  blogId: string,
  input: BlogEditInput,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const blog = await assertCanReviewBlog(user, blogId);

    if (!input.title.trim()) return fail("Blog title is required.");
    if (!input.content.trim()) return fail("Blog content cannot be empty.");

    await prisma.blog.update({
      where: { id: blogId },
      data: {
        title: input.title.trim(),
        subject: input.subject.trim(),
        content: input.content,
        excerpt: buildExcerpt(input.content, input.excerpt),
        readMinutes: readingMinutes(input.content),
        tags: input.tags.map((t) => t.trim()).filter(Boolean).slice(0, 12),
        featuredImage: input.featuredImage?.trim() || null,
        featured: input.featured ?? false,
      },
    });

    revalidateBlogSurfaces(blog.slug);
    return { success: true };
  } catch (err) {
    console.error("updateBlogFromReview error:", err);
    return fail(err instanceof Error ? err.message : "Could not save those edits.");
  }
}
