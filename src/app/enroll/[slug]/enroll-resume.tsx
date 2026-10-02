"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "waiting" | "enrolling" | "error";

export function EnrollResume({ slug }: { slug: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [error, setError] = useState("");
  // Guards against the effect firing twice (StrictMode, session refresh).
  const startedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/enroll/${slug}`)}`);
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("enrolling");

    (async () => {
      try {
        const res = await fetch("/api/courses/enroll-free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Could not enroll you in this course.");
          setPhase("error");
          return;
        }

        // `replace`, not `push`: this page is plumbing, so the back button
        // should return to the course page, not re-run the enrollment.
        router.replace(`/dashboard/my-courses/${data.slug ?? slug}`);
      } catch {
        setError("We couldn't reach the server. Please check your connection.");
        setPhase("error");
      }
    })();
  }, [status, slug, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm rounded-3xl border border-surface-muted bg-white p-8 text-center shadow-card">
        {phase === "error" ? (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle size={26} />
            </span>
            <h1 className="mt-5 font-display text-xl font-bold text-ink">
              Couldn&apos;t complete enrollment
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{error}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href={`/courses/${slug}`}>
                <Button variant="secondary" className="w-full">
                  Back to course
                </Button>
              </Link>
              <Link href="/dashboard/my-courses">
                <Button variant="ghost" className="w-full">
                  Go to My Courses
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <GraduationCap size={26} />
            </span>
            <h1 className="mt-5 font-display text-xl font-bold text-ink">
              {status === "unauthenticated" ? "Taking you to sign in…" : "Enrolling you…"}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {status === "unauthenticated"
                ? "We'll finish your free enrollment right after you sign in."
                : "Adding this course to My Courses. One moment."}
            </p>
            <Loader2 size={20} className="mx-auto mt-6 animate-spin text-brand-600" />
          </>
        )}
      </div>
    </div>
  );
}
