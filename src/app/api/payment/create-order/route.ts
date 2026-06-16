import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    /* COMMENTED OUT RAZORPAY INTEGRATION FOR TESTING
    // Amount in paise (Razorpay requires smallest currency unit)
    const amountPaise = Math.round(amount * 100);

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
        amount,
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
    */

    // DUMMY ENROLLMENT FOR TESTING
    await prisma.$transaction(async (tx) => {
      // 1. Create a successful order record
      await tx.order.create({
        data: {
          userId,
          amount,
          status: "Success",
          course: courseTitle,
          courseId: courseId ?? null,
          planName: planName ?? "Batch",
          razorpayOrderId: `dummy_${Date.now()}`,
          razorpayPaymentId: `pay_dummy_${Date.now()}`,
        },
      });

      // 2. Create the enrollment
      if (courseId) {
        await tx.enrollment.upsert({
          where: { userId_courseId: { userId, courseId } },
          create: { userId, courseId, progress: 0 },
          update: {},
        });
      }
    });

    return NextResponse.json({
      dummySuccess: true,
    });
  } catch (err: any) {
    console.error("create-order error:", err);
    const detail = process.env.NODE_ENV !== "production"
      ? (err?.error?.description ?? err?.message ?? String(err))
      : undefined;
    return NextResponse.json({ error: "Could not create order", detail }, { status: 500 });
  }
}
