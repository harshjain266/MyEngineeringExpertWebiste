import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessAdmin } from "@/lib/roles";
import { PROGRAM_BY_SLUG } from "@/config/programs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const actor = (session?.user as any) ?? null;
    if (!canAccessAdmin(actor)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, program } = await req.json();

    if (!courseId || !program) {
      return NextResponse.json({ error: "courseId and program are required" }, { status: 400 });
    }

    if (!PROGRAM_BY_SLUG[program]) {
      return NextResponse.json({ error: "Invalid program slug" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await prisma.course.update({ where: { id: courseId }, data: { program } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("update-course-program error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}