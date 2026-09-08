import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAndSendPasswordResetEmail } from "@/lib/password-reset";
import { EMAIL_FORMAT_ERROR, isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: EMAIL_FORMAT_ERROR }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalized },
    });

    if (user && user.password) {
      await createAndSendPasswordResetEmail(user);
    }

    return NextResponse.json({
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
