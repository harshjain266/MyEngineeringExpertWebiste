import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { announceFreeEnrollment } from "@/lib/notifications";

/**
 * Enrolls the signed-in student in a free master course ("unpaid" status).
 * No Razorpay order and no Order row — only the enrollment itself.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accepts either identifier: the course cards have the id to hand, while the
    // post-login resume page at /enroll/[slug] only knows the slug.
    const body = await req.json().catch(() => ({}));
    const courseId = typeof body.courseId === "string" ? body.courseId : undefined;
    const slug = typeof body.slug === "string" ? body.slug : undefined;

    if (!courseId && !slug) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const course = await prisma.course.findFirst({
      where: courseId ? { id: courseId } : { slug },
      select: { id: true, slug: true, title: true, status: true, disabled: true, approvalStatus: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (course.disabled || course.approvalStatus !== "approved") {
      return NextResponse.json(
        { error: "This course is not available right now." },
        { status: 409 },
      );
    }
    // Paid courses must still go through checkout.
    if (course.status !== "unpaid") {
      return NextResponse.json(
        { error: "This course is not free. Please purchase it to enroll." },
        { status: 402 },
      );
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { id: true },
    });

    if (!existing) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        create: { userId, courseId: course.id, progress: 0 },
        update: {},
      });
      await announceFreeEnrollment({
        userId,
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/my-courses");
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath(`/dashboard/my-courses/${course.slug}`);

    return NextResponse.json({ ok: true, slug: course.slug, alreadyEnrolled: !!existing });
  } catch (err) {
    console.error("enroll-free error:", err);
    return NextResponse.json({ error: "Could not enroll. Please try again." }, { status: 500 });
  }
}
