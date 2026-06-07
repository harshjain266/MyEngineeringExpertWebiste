import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Request an OTP for a mobile number.
 *
 * No SMS provider is wired up, so in non-production the generated code is
 * returned in the response (`devOtp`) and logged — that's how the demo shows
 * you the code. In production you'd send it via SMS and never return it.
 */
export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const normalized = String(phone ?? "").replace(/\D/g, "");

    if (normalized.length < 10) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 },
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    // One active OTP per number at a time.
    await prisma.otp.deleteMany({ where: { phone: normalized } });
    await prisma.otp.create({
      data: {
        phone: normalized,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    console.log(`📲 OTP for ${normalized}: ${code}`);

    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json({
      ok: true,
      message: "OTP sent",
      ...(isProd ? {} : { devOtp: code }),
    });
  } catch (error) {
    console.error("OTP request error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
