import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Find the pending order
    const order = await prisma.order.findUnique({
      where: { razorpayOrderId },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Mark order as successful and enroll the user
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { razorpayOrderId },
        data: { status: "Success", razorpayPaymentId },
      });

      if (order.courseId) {
        await tx.enrollment.upsert({
          where: { userId_courseId: { userId, courseId: order.courseId } },
          create: { userId, courseId: order.courseId, progress: 0 },
          update: {},
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("payment verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
