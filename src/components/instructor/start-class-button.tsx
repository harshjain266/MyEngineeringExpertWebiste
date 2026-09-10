"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { ExternalLink, Loader2, Radio } from "lucide-react";
import { startLiveClass } from "@/app/actions/live-class";
import { Button } from "@/components/ui/button";
import { MeetingPasscode } from "@/components/ui/meeting-passcode";

export function StartClassButton({
  liveClassId,
  status,
  disabled,
}: {
  liveClassId: string;
  status: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState<string | null>(null);
  const isLive = status === "Live" || status === "Ongoing";

  function handleStart() {
    setError("");
    startTransition(async () => {
      const result = await startLiveClass(liveClassId);
      if (!result.success) {
        setError(result.error ?? "Could not start class.");
        return;
      }

      // Kept on screen after the meeting tab opens, so the passcode is still
      // to hand when the provider asks for it.
      setPasscode(result.meetingPassword ?? null);

      router.refresh();
      if (result.meetingUrl) {
        window.open(result.meetingUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        className="h-11"
        onClick={handleStart}
        disabled={disabled || pending}
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isLive ? (
          <ExternalLink size={16} />
        ) : (
          <Radio size={16} />
        )}
        {pending ? "Starting..." : isLive ? "Join Class" : "Start Class"}
      </Button>
      {passcode ? <MeetingPasscode value={passcode} className="py-1" /> : null}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </div>
  );
}
