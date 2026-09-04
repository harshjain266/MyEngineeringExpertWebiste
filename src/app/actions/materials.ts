"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, canAccessAdmin } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { announceStudyMaterial } from "@/lib/notifications";
import type { MaterialKind, User } from "@/types";

/**
 * Study material a teacher shares inside a course. Only students who bought the
 * course can read it (see `getCourseMaterialsForStudent`).
 */

type ActionResult = { success: true } | { success: false; error: string };

const KINDS: MaterialKind[] = ["note", "assignment", "slide", "reference", "link"];

/** ~6MB of base64 ≈ the 4.5MB Next.js server-action body limit; keep headroom. */
const MAX_URL_LENGTH = 6_000_000;

/**
 * Upload rights: the course's own teacher, the admin who manages that teacher,
 * or the superadmin.
 */
async function assertCanManageCourseMaterial(user: User, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
      instructor: { select: { id: true, userId: true, adminId: true } },
    },
  });

  if (!course) throw new Error("That course no longer exists.");
  if (isSuperAdmin(user)) return course;
  if (user.role === "instructor" && course.instructor.userId === user.id) return course;
  if (canAccessAdmin(user) && course.instructor.adminId === user.id) return course;

  throw new Error("You can only manage material for your own courses.");
}

function isSafeUrl(url: string) {
  return /^https:\/\//i.test(url) || /^data:[a-z0-9.+/-]+;base64,/i.test(url);
}

export interface CreateMaterialInput {
  courseId: string;
  title: string;
  description?: string;
  kind: MaterialKind;
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export async function createStudyMaterial(
  input: CreateMaterialInput,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Please sign in again." };

    const course = await assertCanManageCourseMaterial(user, input.courseId);

    if (!input.title?.trim()) {
      return { success: false, error: "Give this material a title." };
    }
    if (!input.url || !isSafeUrl(input.url)) {
      return {
        success: false,
        error: "Attach a file or paste an https:// link.",
      };
    }
    if (input.url.length > MAX_URL_LENGTH) {
      return { success: false, error: "That file is too large. Keep uploads under 4MB." };
    }
    if (!KINDS.includes(input.kind)) {
      return { success: false, error: "Pick a valid material type." };
    }

    const material = await prisma.studyMaterial.create({
      data: {
        courseId: course.id,
        title: input.title.trim().slice(0, 160),
        description: input.description?.trim().slice(0, 600) || null,
        kind: input.kind,
        url: input.url,
        fileName: input.fileName?.slice(0, 200) || null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType?.slice(0, 120) || null,
        uploadedById: user.id,
      },
    });

    await announceStudyMaterial(material.id);

    revalidatePath(`/instructor/batches/${course.slug}`);
    revalidatePath("/dashboard/materials");
    revalidatePath("/notifications");
    revalidatePath(`/dashboard/my-courses/${course.slug}`);

    return { success: true };
  } catch (err) {
    console.error("createStudyMaterial error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not save that material.",
    };
  }
}

export async function deleteStudyMaterial(materialId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Please sign in again." };

    const material = await prisma.studyMaterial.findUnique({
      where: { id: materialId },
      select: { id: true, courseId: true },
    });
    if (!material) return { success: false, error: "That material no longer exists." };

    const course = await assertCanManageCourseMaterial(user, material.courseId);
    await prisma.studyMaterial.delete({ where: { id: materialId } });

    revalidatePath(`/instructor/batches/${course.slug}`);
    revalidatePath(`/dashboard/my-courses/${course.slug}`);

    return { success: true };
  } catch (err) {
    console.error("deleteStudyMaterial error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not delete that material.",
    };
  }
}
