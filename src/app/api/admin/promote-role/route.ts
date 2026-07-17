import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  console.log("[API promote-role] POST received");
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      console.warn("[API promote-role] Unauthorized attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, action } = await req.json();
    console.log(`[API promote-role] userId=${userId}, action=${action}`);

    if (!userId || !["promote", "demote"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`[API promote-role] User not found: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "promote") {
      if (user.role !== "student") {
        return NextResponse.json({ error: "Only students can be promoted to instructor" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { role: "instructor" },
        });

        let instructor = await tx.instructor.findUnique({ where: { userId } });
        if (instructor) {
          instructor = await tx.instructor.update({
            where: { id: instructor.id },
            data: { name: user.name, title: "Instructor" },
          });
          console.log(`[API promote-role] Re-linked existing instructor record ${instructor.id}`);
        } else {
          instructor = await tx.instructor.create({
            data: {
              userId,
              name: user.name,
              title: "Instructor",
              avatar: user.avatar,
            },
          });
        }

        return { updatedUser: updated, instructor };
      });

      console.log(`[API promote-role] User ${userId} promoted to instructor successfully`);
      return NextResponse.json({
        ok: true,
        user: {
          id: result.updatedUser.id,
          name: result.updatedUser.name,
          email: result.updatedUser.email ?? "",
          phone: result.updatedUser.phone ?? "",
          role: result.updatedUser.role,
          isDisabled: result.updatedUser.isDisabled,
          createdAt: result.updatedUser.createdAt.toISOString(),
        },
        instructor: {
          id: result.instructor.id,
        },
      });
    }

    // Demote: instructor -> student
    if (user.role !== "instructor") {
      return NextResponse.json({ error: "Only instructors can be demoted to student" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const instructor = await tx.instructor.findUnique({
        where: { userId },
        include: { _count: { select: { courses: true } } },
      });

      if (instructor) {
        if (instructor._count.courses > 0) {
          await tx.course.updateMany({
            where: { instructorId: instructor.id },
            data: { disabled: true },
          });
        }

        // Unlink user from instructor record (don't delete — preserves courses/LiveClasses)
        await tx.instructor.update({
          where: { id: instructor.id },
          data: { userId: null },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { role: "student" },
      });
    });

    console.log(`[API promote-role] User ${userId} demoted to student successfully`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API promote-role] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
