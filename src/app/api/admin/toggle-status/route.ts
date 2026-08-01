import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessAdmin, canManageUser } from "@/lib/roles";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const actor = (session?.user as any) ?? null;
    if (!canAccessAdmin(actor)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id, disabled } = await req.json();

    if (!type || !id || typeof disabled !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // ── Admin accounts: only the superadmin may enable/disable ───────────
    if (type === "admin") {
      if (actor.role !== "superadmin") {
        return NextResponse.json({ error: "Only superadmin can manage admin accounts" }, { status: 403 });
      }
      if (id === actor.id) {
        return NextResponse.json({ error: "You cannot disable your own account" }, { status: 400 });
      }
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== "admin") {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }
      await prisma.user.update({ where: { id }, data: { isDisabled: disabled } });
      return NextResponse.json({ ok: true });
    }

    if (type === "user") {
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (!canManageUser(actor, target.role)) {
        return NextResponse.json({ error: "You cannot manage accounts with equal or higher privileges" }, { status: 403 });
      }
      await prisma.user.update({ where: { id }, data: { isDisabled: disabled } });
      return NextResponse.json({ ok: true });
    }

    if (type === "instructor") {
      const instructor = await prisma.instructor.findUnique({
        where: { id },
        select: { userId: true, adminId: true },
      });
      if (!instructor || !instructor.userId) {
        return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
      }
      // Admins may only toggle teachers they own.
      if (actor.role === "admin" && instructor.adminId !== actor.id) {
        return NextResponse.json({ error: "This teacher is not under your management" }, { status: 403 });
      }
      await prisma.user.update({
        where: { id: instructor.userId },
        data: { isDisabled: disabled },
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "course") {
      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
      // Admins see every course platform-wide and may show/hide any of them.
      await prisma.course.update({ where: { id }, data: { disabled } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("toggle-status error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
