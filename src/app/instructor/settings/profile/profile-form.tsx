"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Link2, ImageIcon } from "lucide-react";
import { updateInstructorProfile } from "@/app/actions/instructor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProfileForm({
  initialData,
}: {
  initialData: any;
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar || "");
  const [urlInput, setUrlInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function importUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setAvatarUrl(url);
    setUrlInput("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large (max 5MB)." });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAvatarUrl(data.url);
      setMessage({ type: "success", text: "Image uploaded!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Upload failed." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearAvatar() {
    setAvatarUrl("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("avatar", avatarUrl);
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

      <div className="space-y-3">
        <label className="text-sm font-semibold text-ink-soft">
          Avatar Image
        </label>
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-surface-muted bg-surface-muted/30">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted">
                <ImageIcon size={32} />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
            >
              <Upload size={15} />
              {uploading ? "Uploading..." : "Import Image"}
            </button>
            <div className="relative">
              <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), importUrl())}
                placeholder="Or paste image URL..."
                className="h-9 w-full rounded-xl border border-surface-muted bg-white pl-8 pr-3 text-xs text-ink placeholder-ink-muted/60 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={clearAvatar}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 w-fit"
              >
                Remove avatar
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-muted">
          Upload an image or paste a public URL. Leave blank for default.
        </p>
      </div>

      <input type="hidden" name="avatar" value={avatarUrl} />

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

      <Button type="submit" disabled={loading || uploading} className="w-full md:w-auto">
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

const inputClass =
  "w-full rounded-2xl border border-surface-muted bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100";
