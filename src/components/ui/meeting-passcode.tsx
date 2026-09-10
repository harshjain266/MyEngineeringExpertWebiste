"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The passcode that goes with a class's meeting link.
 *
 * Shown to everyone who can actually attend — the host teacher and the students
 * the class is for — because a link on its own doesn't get them into the room.
 * Renders nothing when the class has no passcode.
 */
export function MeetingPasscode({
  value,
  className,
  tone = "light",
  label = "Passcode",
}: {
  value?: string | null;
  className?: string;
  /** `dark` for placement on the brand gradient / coloured banners. */
  tone?: "light" | "dark";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the code stays visible to type by hand.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy passcode"
      className={cn(
        "group inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-colors",
        tone === "dark"
          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
          : "border-surface-muted bg-surface-subtle text-ink hover:border-brand-200 hover:bg-brand-50",
        className,
      )}
    >
      <KeyRound
        size={13}
        className={cn("shrink-0", tone === "dark" ? "text-white/70" : "text-brand-600")}
      />
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          tone === "dark" ? "text-white/70" : "text-ink-muted",
        )}
      >
        {label}
      </span>
      <span className="truncate font-mono text-sm font-bold tracking-wide">{value}</span>
      {copied ? (
        <Check size={13} className="shrink-0 text-emerald-500" />
      ) : (
        <Copy
          size={13}
          className={cn(
            "shrink-0 opacity-60 transition-opacity group-hover:opacity-100",
            tone === "dark" ? "text-white" : "text-ink-muted",
          )}
        />
      )}
    </button>
  );
}
