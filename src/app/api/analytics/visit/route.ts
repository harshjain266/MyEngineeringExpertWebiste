import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { page } = await req.json().catch(() => ({ page: "/" }));

    // Get visitor ID from cookie, or create a new one
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/ee_vid=([^;]+)/);
    let visitorId = match?.[1];

    let isNewVisitor = false;

    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      isNewVisitor = true;
    }

    // Increment total visits
    await prisma.$executeRaw`
      INSERT INTO "SiteCounter" ("id", "key", "value", "updatedAt")
      VALUES ('total_visits', 'total_visits', 1, NOW())
      ON CONFLICT ("id") DO UPDATE SET "value" = "SiteCounter"."value" + 1, "updatedAt" = NOW()
    `;

    // If new visitor, increment unique visitors too
    if (isNewVisitor) {
      await prisma.$executeRaw`
        INSERT INTO "SiteCounter" ("id", "key", "value", "updatedAt")
        VALUES ('unique_visitors', 'unique_visitors', 1, NOW())
        ON CONFLICT ("id") DO UPDATE SET "value" = "SiteCounter"."value" + 1, "updatedAt" = NOW()
      `;
    }

    // Increment daily counter
    const today = new Date().toISOString().split("T")[0];
    const dailyKey = `daily_${today}`;
    await prisma.$executeRaw`
      INSERT INTO "SiteCounter" ("id", "key", "value", "updatedAt")
      VALUES (${dailyKey}, ${dailyKey}, 1, NOW())
      ON CONFLICT ("id") DO UPDATE SET "value" = "SiteCounter"."value" + 1, "updatedAt" = NOW()
    `;

    const response = NextResponse.json({ ok: true });
    if (!visitorId || isNewVisitor) {
      response.cookies.set("ee_vid", visitorId!, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err) {
    console.error("analytics/visit error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
