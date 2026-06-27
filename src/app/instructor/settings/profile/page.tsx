import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import ProfileForm from "./profile-form";

export const metadata = {
  title: "Instructor Profile Settings",
};

export default async function InstructorProfileSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // Handled by layout redirect
  }

  const instructorData = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/instructor/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} /> Back to Instructor Dashboard
        </Button>
      </Link>

      <div className="rounded-3xl border border-surface-muted bg-white p-6 shadow-card md:p-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">
            Public Profile
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Teacher Details
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            This information is shown to students on your teacher profile and course pages.
          </p>
        </div>

        <ProfileForm initialData={instructorData} />
      </div>
    </div>
  );
}
