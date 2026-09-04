"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Notification mutations.
 *
 * Every write is scoped by `userId` in the `where` clause rather than by an
 * ownership check after the fact, so a forged id simply matches nothing.
 */

type ActionResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED: ActionResult = {
  success: false,
  error: "Please sign in again.",
};

function revalidateSurfaces() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationRead(
  id: string,
  read = true,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED;

    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { readAt: read ? new Date() : null },
    });

    revalidateSurfaces();
    return { success: true };
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return { success: false, error: "Could not update that notification." };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED;

    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    revalidateSurfaces();
    return { success: true };
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    return { success: false, error: "Could not mark everything as read." };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED;

    await prisma.notification.deleteMany({ where: { id, userId: user.id } });

    revalidateSurfaces();
    return { success: true };
  } catch (err) {
    console.error("deleteNotification error:", err);
    return { success: false, error: "Could not delete that notification." };
  }
}

/** Clear everything already read — the "tidy up" action on the list. */
export async function clearReadNotifications(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED;

    await prisma.notification.deleteMany({
      where: { userId: user.id, readAt: { not: null } },
    });

    revalidateSurfaces();
    return { success: true };
  } catch (err) {
    console.error("clearReadNotifications error:", err);
    return { success: false, error: "Could not clear those notifications." };
  }
}
