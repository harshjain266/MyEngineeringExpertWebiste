import "server-only";

import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * In-app notifications.
 *
 * Events fan out on write: one row per recipient, deduped by `dedupeKey`, so
 * the read path stays a single indexed query and re-running an event (an
 * approve → reject → approve cycle, a retried request) cannot duplicate a row.
 *
 * Every function here is best-effort. A notification failing must never roll
 * back the thing that triggered it, so callers use `safely()` and the error is
 * only logged.
 */

interface NotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  /** Stable per-event identity, e.g. `live-class:<id>`. */
  dedupeKey: string;
}

/** Postgres has a 65535 bind-parameter ceiling; chunk large fan-outs. */
const CHUNK = 500;

async function safely<T>(label: string, fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[notifications] ${label} failed:`, err);
    return undefined;
  }
}

/** Write one row per recipient, skipping anyone who already has this event. */
async function fanOut(userIds: string[], input: NotificationInput) {
  const recipients = [...new Set(userIds)].filter(Boolean);
  if (recipients.length === 0) return;

  for (let i = 0; i < recipients.length; i += CHUNK) {
    await prisma.notification.createMany({
      data: recipients.slice(i, i + CHUNK).map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        dedupeKey: input.dedupeKey,
      })),
      skipDuplicates: true,
    });
  }
}

/** Notify a single user. */
export function notifyUser(userId: string | null | undefined, input: NotificationInput) {
  if (!userId) return Promise.resolve();
  return safely(`notifyUser(${input.dedupeKey})`, () => fanOut([userId], input));
}

/** Notify every active student — used for platform-wide events. */
export function notifyAllStudents(input: NotificationInput) {
  return safely(`notifyAllStudents(${input.dedupeKey})`, async () => {
    const students = await prisma.user.findMany({
      where: { role: "student", isDisabled: false },
      select: { id: true },
    });
    await fanOut(students.map((s) => s.id), input);
  });
}

/** Notify only the students enrolled in one course. */
export function notifyCourseStudents(courseId: string, input: NotificationInput) {
  return safely(`notifyCourseStudents(${input.dedupeKey})`, async () => {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, user: { isDisabled: false } },
      select: { userId: true },
    });
    await fanOut(enrollments.map((e) => e.userId), input);
  });
}

/** Notify every superadmin — the reviewers for courses and live classes. */
export function notifySuperAdmins(input: NotificationInput) {
  return safely(`notifySuperAdmins(${input.dedupeKey})`, async () => {
    const admins = await prisma.user.findMany({
      where: { role: "superadmin", isDisabled: false },
      select: { id: true },
    });
    await fanOut(admins.map((a) => a.id), input);
  });
}

/** Notify the admin who manages this author's teacher, else the superadmins. */
export function notifyBlogReviewers(authorId: string, input: NotificationInput) {
  return safely(`notifyBlogReviewers(${input.dedupeKey})`, async () => {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: authorId },
      select: { admin: { select: { id: true, isDisabled: true } } },
    });

    const admin = instructor?.admin;
    if (admin && !admin.isDisabled) {
      await fanOut([admin.id], input);
      return;
    }

    const supers = await prisma.user.findMany({
      where: { role: "superadmin", isDisabled: false },
      select: { id: true },
    });
    await fanOut(supers.map((s) => s.id), input);
  });
}

/* ─── Event helpers ─────────────────────────────────────────── */

function whenLabel(date: Date) {
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * A live class became visible to students.
 *
 * Master classes (no course) reach every student; batch classes reach only the
 * students who bought that course. Called both when a superadmin creates one
 * directly and when a pending one is approved.
 */
export async function announceLiveClass(liveClassId: string) {
  const liveClass = await prisma.liveClass
    .findUnique({
      where: { id: liveClassId },
      include: {
        instructor: { select: { name: true } },
        course: { select: { title: true, slug: true } },
      },
    })
    .catch(() => null);

  if (!liveClass || liveClass.approvalStatus !== "approved") return;

  const when = whenLabel(liveClass.startsAt);

  if (!liveClass.courseId) {
    await notifyAllStudents({
      type: "master_class",
      title: `Free master class: ${liveClass.title}`,
      body: `${liveClass.instructor.name} is hosting "${liveClass.topic}" on ${when}. Open to every student — no purchase needed.`,
      href: "/dashboard/live-classes",
      dedupeKey: `live-class:${liveClass.id}`,
    });
    return;
  }

  await notifyCourseStudents(liveClass.courseId, {
    type: "live_class",
    title: `New class in ${liveClass.course?.title ?? "your batch"}`,
    body: `${liveClass.title} — ${liveClass.topic}, ${when} with ${liveClass.instructor.name}.`,
    href: `/dashboard/my-courses/${liveClass.course?.slug ?? ""}`,
    dedupeKey: `live-class:${liveClass.id}`,
  });
}

/** A teacher shared new study material with a course. */
export async function announceStudyMaterial(materialId: string) {
  const material = await prisma.studyMaterial
    .findUnique({
      where: { id: materialId },
      include: { course: { select: { title: true, slug: true } } },
    })
    .catch(() => null);

  if (!material) return;

  await notifyCourseStudents(material.courseId, {
    type: "material",
    title: `New study material in ${material.course.title}`,
    body: `${material.title}${material.description ? ` — ${material.description}` : ""}`,
    href: `/dashboard/materials?course=${material.course.slug}`,
    dedupeKey: `material:${material.id}`,
  });
}

/** A blog went live for students. */
export async function announceBlog(blogId: string) {
  const blog = await prisma.blog
    .findUnique({
      where: { id: blogId },
      include: { author: { select: { name: true } } },
    })
    .catch(() => null);

  if (!blog || !blog.published || blog.approvalStatus !== "approved") return;

  await notifyAllStudents({
    type: "blog",
    title: `New blog: ${blog.title}`,
    body: `${blog.author.name} published a ${blog.readMinutes} min read on ${blog.subject.replace(/-/g, " ")}.`,
    href: `/blogs/${blog.slug}`,
    dedupeKey: `blog:${blog.id}`,
  });
}

/** Something landed in a reviewer's approval queue. */
export function announceSubmission({
  kind,
  id,
  title,
  submittedBy,
  authorId,
}: {
  kind: "Course" | "Live class" | "Blog";
  id: string;
  title: string;
  submittedBy: string;
  /** Blogs only — routes the notice to that author's managing admin. */
  authorId?: string;
}) {
  const tab =
    kind === "Course" ? "courses" : kind === "Live class" ? "live-classes" : "blogs";

  const input: NotificationInput = {
    type: "approval",
    title: `${kind} awaiting your approval`,
    body: `${submittedBy} submitted "${title}". It stays hidden from students until you review it.`,
    href: `/admin/approvals?tab=${tab}`,
    dedupeKey: `submission:${kind}:${id}`,
  };

  return kind === "Blog" && authorId
    ? notifyBlogReviewers(authorId, input)
    : notifySuperAdmins(input);
}

/** A reviewer approved or rejected someone's submission. */
export function announceDecision({
  kind,
  id,
  title,
  approved,
  note,
  reviewerName,
  recipientId,
  href,
}: {
  kind: "Course" | "Live class" | "Blog";
  id: string;
  title: string;
  approved: boolean;
  note?: string | null;
  reviewerName: string;
  recipientId: string | null | undefined;
  href: string;
}) {
  return notifyUser(recipientId, {
    type: "decision",
    title: approved ? `${kind} approved` : `${kind} needs changes`,
    body: approved
      ? `${reviewerName} approved "${title}". It is now live for students.`
      : `${reviewerName} sent "${title}" back${note ? `: ${note}` : "."}`,
    href,
    // A re-decision should surface again, so the verdict is part of the key.
    dedupeKey: `decision:${kind}:${id}:${approved ? "approved" : "rejected"}`,
  });
}

/** A purchase completed and the student was enrolled. */
export function announceEnrollment({
  userId,
  orderId,
  courseTitle,
  courseSlug,
}: {
  userId: string;
  orderId: string;
  courseTitle: string;
  courseSlug?: string | null;
}) {
  return notifyUser(userId, {
    type: "order",
    title: `You're enrolled in ${courseTitle}`,
    body: "Payment received. Your live classes and study material are ready.",
    href: courseSlug ? `/dashboard/my-courses/${courseSlug}` : "/dashboard/my-courses",
    dedupeKey: `order:${orderId}`,
  });
}
