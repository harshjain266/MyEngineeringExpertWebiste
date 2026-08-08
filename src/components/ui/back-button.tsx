"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({
  href = "/",
  children = "Back",
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(href);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink",
        className,
      )}
    >
      <ArrowLeft size={16} />
      {children}
    </button>
  );
}
