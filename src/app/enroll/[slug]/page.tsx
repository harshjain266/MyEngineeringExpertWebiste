import type { Metadata } from "next";
import { EnrollResume } from "./enroll-resume";

export const metadata: Metadata = { title: "Enrolling…" };

/**
 * Resume point for a free enrollment that was interrupted by sign-in.
 *
 * "Enroll for Free" on a course page sends a signed-out visitor here (via the
 * auth modal's redirect, or the login page's `callbackUrl`). Landing here means
 * "finish what I clicked": enroll, then drop the student into the course inside
 * My Courses — rather than dumping them back on the marketing page with the
 * same button still unclicked.
 */
export default async function EnrollPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EnrollResume slug={slug} />;
}
