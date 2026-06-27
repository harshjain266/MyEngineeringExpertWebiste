"use client";

import { useState } from "react";
import { updateInstructorProfile } from "@/app/actions/instructor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProfileForm({
  initialData,
}: {
  initialData: any;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateInstructorProfile(formData);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } else {
      setMessage({ type: "error", text: result.error || "Something went wrong." });
    }
    
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-ink-soft">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={initialData?.name || ""}
            className={inputClass}
            placeholder="Dr. Aditi Sharma"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-ink-soft">
            Professional Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={initialData?.title || ""}
            className={inputClass}
            placeholder="DSA and Placement Mentor"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="avatar" className="text-sm font-semibold text-ink-soft">
          Avatar URL
        </label>
        <input
          type="url"
          id="avatar"
          name="avatar"
          defaultValue={initialData?.avatar || ""}
          className={inputClass}
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-ink-muted">Leave blank to use your account&apos;s default avatar.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-semibold text-ink-soft">
          About Me (Bio)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          defaultValue={initialData?.bio || ""}
          className={cn(inputClass, "min-h-32 resize-y py-3")}
          placeholder="Tell students what you teach, how you teach, and what outcomes you help them achieve."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="qualifications" className="text-sm font-semibold text-ink-soft">
          Qualifications
        </label>
        <textarea
          id="qualifications"
          name="qualifications"
          rows={4}
          defaultValue={initialData?.qualifications || ""}
          className={cn(inputClass, "min-h-28 resize-y py-3")}
          placeholder="e.g. M.Tech CSE, GATE qualified, ex-SDE, published research, etc."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="experience" className="text-sm font-semibold text-ink-soft">
          Experience
        </label>
        <textarea
          id="experience"
          name="experience"
          rows={4}
          defaultValue={initialData?.experience || ""}
          className={cn(inputClass, "min-h-28 resize-y py-3")}
          placeholder="e.g. 8+ years teaching DSA, mentored 20k+ students, placement trainer for tier-2 colleges."
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

const inputClass =
  "w-full rounded-2xl border border-surface-muted bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100";
