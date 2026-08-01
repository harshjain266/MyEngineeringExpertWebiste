import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/roles";

/**
 * Superadmin-only: assign (or unassign) one or many teachers to an admin.
 * POST /api/admin/assign-instructor  { instructorIds: string[], adminId: string | null }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const actor = (session?.user as any) ?? null;
    if (!isSuperAdmin(actor)) {
      return NextResponse.json({ error: "Only superadmin can assign teachers" }, { status: 403 });
    }

    const { instructorIds, instructorId, adminId } = await req.json();

    // Accept both the batch form (instructorIds[]) and the legacy single form.
    const ids = Array.isArray(instructorIds)
      ? instructorIds.filter((id: unknown): id is string => typeof id === "string")
      : instructorId
        ? [instructorId]
        : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No teachers selected" }, { status: 400 });
    }
    if (adminId !== null && !adminId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (adminId) {
      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      if (!admin || admin.role !== "admin") {
        return NextResponse.json({ error: "Target account is not an admin" }, { status: 400 });
      }
    }

    const existing = await prisma.instructor.count({ where: { id: { in: ids } } });
    if (existing !== ids.length) {
      return NextResponse.json({ error: "One or more teachers were not found" }, { status: 404 });
    }

    await prisma.instructor.updateMany({
      where: { id: { in: ids } },
      data: { adminId: adminId ?? null },
    });

    return NextResponse.json({ ok: true, count: ids.length, adminId: adminId ?? null });
  } catch (err) {
    console.error("assign-instructor error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
