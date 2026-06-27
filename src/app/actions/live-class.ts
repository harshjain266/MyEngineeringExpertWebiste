"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function startLiveClass(liveClassId: string) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "instructor") {
      return { success: false, error: "Instructor access required." };
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        course: { select: { slug: true } },
        instructor: { select: { userId: true } },
      },
    });

    if (!liveClass || liveClass.instructor.userId !== user.id) {
      return { success: false, error: "You can only start your own class." };
    }

    if (!liveClass.meetingUrl) {
      return { success: false, error: "Meeting link is not available for this class." };
    }

    await prisma.liveClass.update({
      where: { id: liveClass.id },
      data: { status: "Live" },
    });

    revalidatePath("/instructor/dashboard");
    revalidatePath("/instructor/batches");
    if (liveClass.course?.slug) {
      revalidatePath(`/instructor/batches/${liveClass.course.slug}`);
      revalidatePath(`/dashboard/my-courses/${liveClass.course.slug}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/live-classes");

    return { success: true, meetingUrl: liveClass.meetingUrl };
  } catch (error) {
    console.error("Failed to start live class:", error);
    return { success: false, error: "Could not start class. Please try again." };
  }
}
