import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin, isSuperAdmin } from "@/lib/roles";
import { getApprovalQueue } from "@/lib/data";
import { ApprovalsClient } from "./approvals-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Approvals",
};

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user)) redirect("/dashboard");

  const [{ tab }, queue] = await Promise.all([searchParams, getApprovalQueue(user)]);

  return (
    <ApprovalsClient
      canReviewCatalogue={isSuperAdmin(user)}
      initialTab={tab}
      courses={queue.courses}
      liveClasses={queue.liveClasses}
      blogs={queue.blogs}
      counts={queue.counts}
    />
  );
}
