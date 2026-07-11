import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id, disabled } = await req.json();

    if (!type || !id || typeof disabled !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (type === "user") {
      await prisma.user.update({
        where: { id },
        data: { isDisabled: disabled },
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "instructor") {
      const instructor = await prisma.instructor.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!instructor || !instructor.userId) {
        return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
      }
      await prisma.user.update({
        where: { id: instructor.userId },
        data: { isDisabled: disabled },
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "course") {
      await prisma.course.update({
        where: { id },
        data: { disabled },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("toggle-status error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
