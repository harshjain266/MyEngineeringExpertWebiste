"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function updateInstructorProfile(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "instructor") {
      return { success: false, error: "Unauthorized. Instructor access required." };
    }

    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const bio = formData.get("bio") as string;
    const qualifications = formData.get("qualifications") as string;
    const experience = formData.get("experience") as string;
    const avatar = formData.get("avatar") as string;

    if (!name || !title) {
      return { success: false, error: "Name and Title are required." };
    }

    // Upsert the instructor record based on userId
    const instructor = await prisma.instructor.upsert({
      where: { userId: user.id },
      update: {
        name,
        title,
        bio,
        qualifications,
        experience,
        avatar: avatar || user.avatar,
      },
      create: {
        userId: user.id,
        name,
        title,
        bio,
        qualifications,
        experience,
        avatar: avatar || user.avatar,
        rating: 0,
        students: 0,
      },
    });

    revalidatePath("/instructor/dashboard");
    revalidatePath("/instructor/settings/profile");
    revalidatePath(`/teachers/${instructor.id}`);
    revalidatePath("/teachers");

    if (avatar && avatar !== user.avatar) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }

    return { success: true, instructorId: instructor.id };
  } catch (error: any) {
    console.error("Failed to update instructor profile:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}
