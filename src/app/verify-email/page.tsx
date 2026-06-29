import Link from "next/link";
import { CheckCircle2, MailWarning } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let verified = false;

  if (token) {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (record && record.expiresAt > new Date()) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerified: new Date() },
        }),
        prisma.emailVerificationToken.deleteMany({
          where: { userId: record.userId },
        }),
      ]);
      verified = true;
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface-subtle px-4">
      <section className="w-full max-w-md rounded-2xl border border-surface-muted bg-white p-8 text-center shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700">
          {verified ? <CheckCircle2 size={30} /> : <MailWarning size={30} />}
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">
          {verified ? "Email verified" : "Verification link expired"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {verified
            ? "Your account is ready. Sign in to continue to your dashboard."
            : "Please sign in again. We will send a fresh verification link if your email is still pending."}
        </p>
        <Link href="/login" className="mt-6 block">
          <Button className="w-full rounded-xl">
            {verified ? "Go to login" : "Back to login"}
          </Button>
        </Link>
      </section>
    </main>
  );
}
