"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/auth-modal";

/** One-click enrollment for a free master course — no payment gateway involved. */
export function EnrollFreeButton({
  courseId,
  courseSlug,
  children = "Enroll for Free",
  ...props
}: ButtonProps & { courseId: string; courseSlug: string }) {
  const { status } = useSession();
  const { open } = useAuthModal();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (status !== "authenticated") {
      // Resume the enrollment after sign-in instead of returning the visitor to
      // this page with the button still unclicked. /enroll/[slug] finishes the
      // job and lands them on the course inside My Courses.
      open({ redirectTo: `/enroll/${courseSlug}` });
      return;
    }

    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/courses/enroll-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not enroll. Please try again.");
        setPending(false);
        return;
      }
      // Straight into the course workspace under My Courses.
      router.push(`/dashboard/my-courses/${data.slug ?? courseSlug}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  };

  return (
    <span className="flex flex-col gap-1">
      <Button onClick={handleClick} disabled={pending || status === "loading"} {...props}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : children}
      </Button>
      {error && <span className="text-[11px] text-rose-500">{error}</span>}
    </span>
  );
}
