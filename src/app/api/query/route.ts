import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const SUPPORT_EMAIL = "myengineeringexpert1@gmail.com";

export async function POST(req: Request) {
  try {
    const { category, subject, message, userType, userName, userEmail } = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6c5ce7, #4f46e5); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 20px; }
          .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; }
          .field { margin-bottom: 16px; }
          .label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { margin-top: 4px; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; }
          .message-box { white-space: pre-wrap; }
          .footer { padding: 16px 24px; background: #f1f5f9; border-radius: 0 0 12px 12px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Support Query</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">From ${userType === "instructor" ? "Instructor" : "Student"} Portal</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From</div>
              <div class="value">${userName || "Unknown"} (${userEmail || "No email"})</div>
            </div>
            <div class="field">
              <div class="label">Category</div>
              <div class="value">${category}</div>
            </div>
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="value message-box">${message.replace(/\n/g, "<br>")}</div>
            </div>
          </div>
          <div class="footer">
            This query was sent from the EngineeringExpert ${userType === "instructor" ? "Instructor" : "Student"} Portal.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Support Query from ${userType === "instructor" ? "Instructor" : "Student"} Portal

From: ${userName || "Unknown"} (${userEmail || "No email"})
Category: ${category}
Subject: ${subject}

Message:
${message}
    `;

    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Support Query] ${subject}`,
      html,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("query send error:", err);
    return NextResponse.json({ error: "Failed to send query" }, { status: 500 });
  }
}
