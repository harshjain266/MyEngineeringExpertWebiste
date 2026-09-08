import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileSettingsClient } from "./profile-settings-client";

export const metadata: Metadata = { title: "Profile Settings" };

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      createdAt: true,
      emailVerified: true,
      password: true,
      _count: { select: { enrollments: true, orders: true } },
    },
  });

  return (
    <ProfileSettingsClient
      user={user}
      memberSince={dbUser?.createdAt.toISOString() ?? new Date().toISOString()}
      emailVerified={!!dbUser?.emailVerified}
      hasPassword={!!dbUser?.password}
      enrolledCount={dbUser?._count.enrollments ?? 0}
      orderCount={dbUser?._count.orders ?? 0}
    />
  );
}
