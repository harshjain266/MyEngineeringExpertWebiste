import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";

const RESET_TOKEN_TTL_HOURS = 1;

export async function createAndSendPasswordResetEmail(user: {
  id: string;
  email: string | null;
  name: string;
}) {
  if (!user.email) return;

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = `${appUrl()}/reset-password?token=${token}`;
  const subject = "Reset your EngineeringExpert password";
  const text = `Hi ${user.name}, reset your EngineeringExpert password using this link: ${resetUrl}`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Reset your password</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset the password for your EngineeringExpert account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">
            Reset password
          </a>
        </p>
        <p>This link expires in ${RESET_TOKEN_TTL_HOURS} hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
