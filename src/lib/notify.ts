import "server-only";

import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";

/**
 * Approval notifications.
 *
 * Every send is best-effort: a mail provider outage must never roll back the
 * content that was just created, so callers use `notifySafe` and the failure is
 * only logged.
 */

/** Mailbox the superadmin actually watches for incoming approvals. */
export const SUPERADMIN_NOTIFY_EMAIL =
  process.env.SUPERADMIN_NOTIFY_EMAIL || "myengineeringexpert1@gmail.com";

const BRAND = "EngineeringExpert";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TemplateInput {
  heading: string;
  intro: string;
  rows: Array<[string, string | null | undefined]>;
  ctaLabel: string;
  ctaPath: string;
  accent?: string;
  footNote?: string;
}

function renderTemplate({
  heading,
  intro,
  rows,
  ctaLabel,
  ctaPath,
  accent = "#4f46e5",
  footNote,
}: TemplateInput) {
  const url = `${appUrl()}${ctaPath}`;
  const visibleRows = rows.filter(([, value]) => value != null && value !== "");

  const rowsHtml = visibleRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;width:150px;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${escapeHtml(String(value))}</td>
        </tr>`,
    )
    .join("");

  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:${accent};padding:24px 28px;">
        <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;">${BRAND}</p>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${escapeHtml(heading)}</h1>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 18px;color:#334155;font-size:14px;line-height:22px;">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:22px;">
          ${rowsHtml}
        </table>
        <a href="${url}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:700;">${escapeHtml(ctaLabel)}</a>
        ${
          footNote
            ? `<p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:18px;">${escapeHtml(footNote)}</p>`
            : ""
        }
      </div>
    </div>
  </div>`;

  const text = [
    `${BRAND} — ${heading}`,
    "",
    intro,
    "",
    ...visibleRows.map(([label, value]) => `${label}: ${value}`),
    "",
    `${ctaLabel}: ${url}`,
    footNote ?? "",
  ]
    .join("\n")
    .trim();

  return { html, text };
}

/** Send without ever throwing into the caller's transaction/response path. */
async function notifySafe(
  to: string | string[],
  subject: string,
  input: TemplateInput,
) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  const { html, text } = renderTemplate(input);
  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({ to: recipient, subject, html, text }).catch((err) =>
        console.error(`[notify] failed to email ${recipient}:`, err),
      ),
    ),
  );
}

/** Every superadmin mailbox, plus the monitored shared inbox. */
async function superadminRecipients(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "superadmin", isDisabled: false, email: { not: null } },
    select: { email: true },
  });
  const emails = admins.map((a) => a.email!).concat(SUPERADMIN_NOTIFY_EMAIL);
  return [...new Set(emails.map((e) => e.toLowerCase()))];
}

/** The admin who manages this instructor, falling back to the superadmins. */
export async function blogReviewerRecipients(authorId: string): Promise<string[]> {
  const instructor = await prisma.instructor.findUnique({
    where: { userId: authorId },
    select: { admin: { select: { email: true, isDisabled: true } } },
  });

  const adminEmail = instructor?.admin?.isDisabled ? null : instructor?.admin?.email;
  if (adminEmail) return [adminEmail.toLowerCase()];
  return superadminRecipients();
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return null;
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

/* ─── Submitted-for-approval notices ────────────────────────── */

export async function notifyCourseSubmitted(course: {
  id: string;
  title: string;
  price: number;
  program: string;
  category: string;
  startsOn: Date | null;
  instructorName: string;
  submittedByName: string;
}) {
  await notifySafe(await superadminRecipients(), `Course awaiting approval — ${course.title}`, {
    heading: "A new course needs your approval",
    intro: `${course.submittedByName} created a course and it is waiting in your approval queue. Students will not see it until you approve it.`,
    rows: [
      ["Course", course.title],
      ["Teacher", course.instructorName],
      ["Program", course.program],
      ["Category", course.category],
      ["Price", `₹${course.price}`],
      ["Starts on", formatDateTime(course.startsOn)],
      ["Submitted by", course.submittedByName],
    ],
    ctaLabel: "Review this course",
    ctaPath: "/admin/approvals?tab=courses",
  });
}

export async function notifyLiveClassSubmitted(liveClass: {
  id: string;
  title: string;
  topic: string;
  startsAt: Date;
  courseTitle: string | null;
  instructorName: string;
  submittedByName: string;
}) {
  await notifySafe(
    await superadminRecipients(),
    `Live class awaiting approval — ${liveClass.title}`,
    {
      heading: "A new live class needs your approval",
      intro: `${liveClass.submittedByName} scheduled a live class and it is waiting in your approval queue. Students will not see it until you approve it.`,
      rows: [
        ["Class", liveClass.title],
        ["Topic", liveClass.topic],
        ["Teacher", liveClass.instructorName],
        ["Course", liveClass.courseTitle ?? "Standalone (all students)"],
        ["Starts at", formatDateTime(liveClass.startsAt)],
        ["Submitted by", liveClass.submittedByName],
      ],
      ctaLabel: "Review this live class",
      ctaPath: "/admin/approvals?tab=live-classes",
      accent: "#e11d48",
    },
  );
}

export async function notifyBlogSubmitted(blog: {
  id: string;
  title: string;
  subject: string;
  authorId: string;
  authorName: string;
}) {
  await notifySafe(
    await blogReviewerRecipients(blog.authorId),
    `Blog awaiting approval — ${blog.title}`,
    {
      heading: "A blog post needs your approval",
      intro: `${blog.authorName} submitted a blog post for review. It stays hidden from students until you approve it.`,
      rows: [
        ["Title", blog.title],
        ["Subject", blog.subject],
        ["Author", blog.authorName],
      ],
      ctaLabel: "Review this blog",
      ctaPath: "/admin/approvals?tab=blogs",
      accent: "#0d9488",
    },
  );
}

/* ─── Decision notices back to the author ───────────────────── */

export async function notifyDecision({
  to,
  kind,
  title,
  approved,
  note,
  reviewerName,
  ctaPath,
}: {
  to: string | null | undefined;
  kind: "Course" | "Live class" | "Blog";
  title: string;
  approved: boolean;
  note?: string | null;
  reviewerName: string;
  ctaPath: string;
}) {
  if (!to) return;

  await notifySafe(to, `${kind} ${approved ? "approved" : "rejected"} — ${title}`, {
    heading: approved ? `${kind} approved` : `${kind} needs changes`,
    intro: approved
      ? `${reviewerName} approved your ${kind.toLowerCase()}. It is now live for students.`
      : `${reviewerName} sent your ${kind.toLowerCase()} back. Review the note below, make the changes and resubmit.`,
    rows: [
      [kind, title],
      ["Decision", approved ? "Approved" : "Rejected"],
      ["Reviewer", reviewerName],
      ["Note", note || null],
    ],
    ctaLabel: approved ? "View it" : "Open and fix",
    ctaPath,
    accent: approved ? "#059669" : "#e11d48",
  });
}
