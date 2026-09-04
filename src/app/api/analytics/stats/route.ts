import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = (session?.user as any);
    if (!user || !canAccessAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch counters from database
    const counters = await prisma.siteCounter.findMany();
    const counterMap = Object.fromEntries(counters.map((c) => [c.key, c.value]));

    const today = new Date().toISOString().split("T")[0];
    const dailyKey = `daily_${today}`;

    return NextResponse.json({
      totalVisits: counterMap["total_visits"] ?? 0,
      uniqueVisitors: counterMap["unique_visitors"] ?? 0,
      todayVisits: counterMap[dailyKey] ?? 0,
    });
  } catch (err) {
    console.error("analytics/stats error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
