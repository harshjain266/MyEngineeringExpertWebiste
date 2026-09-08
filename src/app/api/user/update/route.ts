import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Digits, spaces and the usual separators; 8–15 digits once stripped. */
function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!/^\+?[\d\s()-]+$/.test(trimmed) || digits.length < 8 || digits.length > 15) {
    return null;
  }
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data: Prisma.UserUpdateInput = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2) {
        return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
      }
      if (name.length > 60) {
        return NextResponse.json({ error: "Name must be 60 characters or fewer" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.phone !== undefined) {
      const raw = typeof body.phone === "string" ? body.phone.trim() : "";
      if (!raw) {
        data.phone = null;
      } else {
        const phone = normalizePhone(raw);
        if (!phone) {
          return NextResponse.json(
            { error: "That phone number doesn't look right. Use 8–15 digits, e.g. +91 98765 43210." },
            { status: 400 },
          );
        }
        data.phone = phone;
      }
    }

    if (body.avatar !== undefined) {
      const avatar = typeof body.avatar === "string" ? body.avatar.trim() : "";
      if (!avatar) {
        data.avatar = null;
      } else if (!/^(https:\/\/|data:image\/)/.test(avatar)) {
        return NextResponse.json(
          { error: "Profile photo must be an uploaded image or an https link." },
          { status: 400 },
        );
      } else {
        data.avatar = avatar;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, plan: true },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    // `phone` is unique, so a number already on another account lands here.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "That phone number is already linked to another account." },
        { status: 400 },
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
