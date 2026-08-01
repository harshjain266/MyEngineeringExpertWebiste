import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessAdmin } from "@/lib/roles";

export async function POST(req: Request) {
  console.log("[API promote-role] POST received");
  try {
    const session = await getServerSession(authOptions);
    const actor = (session?.user as any) ?? null;
    if (!canAccessAdmin(actor)) {
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

      // Teachers promoted by an admin belong to that admin. Superadmin-created
      // teachers start unassigned and can be handed over to an admin later.
      const adminId = actor.role === "admin" ? actor.id : null;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { role: "instructor" },
        });

        let instructor = await tx.instructor.findUnique({ where: { userId } });
        if (instructor) {
          instructor = await tx.instructor.update({
            where: { id: instructor.id },
            data: { name: user.name, title: "Instructor", adminId },
          });
          console.log(`[API promote-role] Re-linked existing instructor record ${instructor.id}`);
        } else {
          instructor = await tx.instructor.create({
            data: {
              userId,
              name: user.name,
              title: "Instructor",
              avatar: user.avatar,
              adminId,
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
          adminId: result.instructor.adminId,
          adminName: result.instructor.adminId ? actor.name : null,
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
        // Admins may only demote teachers they own.
        if (actor.role === "admin" && instructor.adminId !== actor.id) {
          throw new Error("This teacher is not under your management");
        }

        if (instructor._count.courses > 0) {
          await tx.course.updateMany({
            where: { instructorId: instructor.id },
            data: { disabled: true },
          });
        }

        // Unlink user and clear ownership (don't delete — preserves courses/LiveClasses)
        await tx.instructor.update({
          where: { id: instructor.id },
          data: { userId: null, adminId: null },
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
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("under your management") ? 403 : 500;
    console.error("[API promote-role] Error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
