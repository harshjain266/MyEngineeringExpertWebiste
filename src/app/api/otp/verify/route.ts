import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Pre-check an OTP before the NextAuth sign-in call.
 *
 * Validates the code (without consuming it — the `otp` provider consumes it on
 * the actual sign-in) and reports whether this is a new number, so the client
 * can collect a name for first-time users (PW-style) before creating the user.
 */
export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    const normalized = String(phone ?? "").replace(/\D/g, "");
    const code = String(otp ?? "").replace(/\D/g, "");

    if (normalized.length < 10 || code.length < 6) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const record = await prisma.otp.findFirst({
      where: { phone: normalized, code, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ valid: false });
    }

    const user = await prisma.user.findUnique({ where: { phone: normalized } });

    return NextResponse.json({ valid: true, isNewUser: !user });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
