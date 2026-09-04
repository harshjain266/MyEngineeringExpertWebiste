import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildCourseDetail } from "@/lib/course-detail";
import type { Course } from "@/types";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, courseTitle, amount, planName } = await req.json();

    if (!courseTitle || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Never let a client charge itself an arbitrary price, and never sell a
    // course that is hidden or still waiting on approval.
    let chargeable = Math.round(amount);
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          price: true,
          disabled: true,
          approvalStatus: true,
          instructor: true,
          id: true,
          slug: true,
          title: true,
          category: true,
          level: true,
          originalPrice: true,
          rating: true,
          ratingCount: true,
          durationHours: true,
          lectures: true,
          language: true,
          thumbnail: true,
          tags: true,
          program: true,
        },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
      if (course.disabled || course.approvalStatus !== "approved") {
        return NextResponse.json(
          { error: "This course is not available for purchase right now." },
          { status: 409 },
        );
      }

      const plans = buildCourseDetail(course as unknown as Course).plans;
      const plan =
        plans.find((p) => p.name === (planName ?? "Batch")) ??
        plans.find((p) => p.price === chargeable);

      if (!plan || plan.price !== chargeable) {
        return NextResponse.json(
          { error: "That price is no longer valid. Please reload the page." },
          { status: 409 },
        );
      }
      chargeable = plan.price;
    }

    // Amount in paise (Razorpay requires smallest currency unit)
    const amountPaise = Math.round(chargeable * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        courseTitle,
        planName: planName ?? "Batch",
        userId,
      },
    });

    // Save a pending order in DB
    await prisma.order.create({
      data: {
        userId,
        amount: chargeable,
        status: "Pending",
        course: courseTitle,
        courseId: courseId ?? null,
        planName: planName ?? "Batch",
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("create-order error:", err);
    const detail = process.env.NODE_ENV !== "production"
      ? (err?.error?.description ?? err?.message ?? String(err))
      : undefined;
    return NextResponse.json({ error: "Could not create order", detail }, { status: 500 });
  }
}
