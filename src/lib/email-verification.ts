import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_HOURS = 24;

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "EngineeringExpert <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[email-verification]", text);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Verification email failed: ${body}`);
  }
}

export async function createAndSendVerificationEmail(user: {
  id: string;
  email: string | null;
  name: string;
}) {
  if (!user.email) return;

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const verifyUrl = `${appUrl()}/verify-email?token=${token}`;
  const subject = "Verify your EngineeringExpert email";
  const text = `Hi ${user.name}, verify your email to open your dashboard: ${verifyUrl}`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your email</h2>
        <p>Hi ${user.name},</p>
        <p>Confirm your email address to access your EngineeringExpert dashboard.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">
            Verify email
          </a>
        </p>
        <p>This link expires in ${TOKEN_TTL_HOURS} hours.</p>
      </div>
    `,
  });
}
