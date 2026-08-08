"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileForm({
  initialData,
}: {
  initialData: any;
}) {
  const avatarUrl = initialData?.avatar || "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-ink-soft">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={initialData?.name || ""}
            readOnly
            className={cn(inputClass, readOnlyClass)}
            placeholder="—"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-ink-soft">
            Professional Title
          </label>
          <input
            type="text"
            id="title"
            value={initialData?.title || ""}
            readOnly
            className={cn(inputClass, readOnlyClass)}
            placeholder="—"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-ink-soft">
          Avatar Image
        </label>
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-surface-muted bg-surface-muted/30">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted">
                <ImageIcon size={32} />
              </div>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            This image is shown on your teacher profile.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-semibold text-ink-soft">
          About Me (Bio)
        </label>
        <textarea
          id="bio"
          rows={5}
          value={initialData?.bio || ""}
          readOnly
          className={cn(inputClass, "min-h-32 resize-none py-3", readOnlyClass)}
          placeholder="—"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="qualifications" className="text-sm font-semibold text-ink-soft">
          Qualifications
        </label>
        <textarea
          id="qualifications"
          rows={4}
          value={initialData?.qualifications || ""}
          readOnly
          className={cn(inputClass, "min-h-28 resize-none py-3", readOnlyClass)}
          placeholder="—"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="experience" className="text-sm font-semibold text-ink-soft">
          Experience
        </label>
        <textarea
          id="experience"
          rows={4}
          value={initialData?.experience || ""}
          readOnly
          className={cn(inputClass, "min-h-28 resize-none py-3", readOnlyClass)}
          placeholder="—"
        />
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-surface-muted bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

const readOnlyClass = "cursor-not-allowed opacity-80";