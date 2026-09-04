"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { createStudyMaterial, deleteStudyMaterial } from "@/app/actions/materials";
import { cn } from "@/lib/utils";
import type { MaterialKind, StudyMaterial } from "@/types";
import { MaterialList } from "./material-list";

interface Props {
  courseId: string;
  materials: StudyMaterial[];
}

const KIND_OPTIONS: { value: MaterialKind; label: string }[] = [
  { value: "note", label: "Notes" },
  { value: "assignment", label: "Assignment" },
  { value: "slide", label: "Slides" },
  { value: "reference", label: "Reference" },
  { value: "link", label: "External link" },
];

const inputCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

/** Teacher-side study-material panel: upload, list and remove. */
export function MaterialManager({ courseId, materials }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, startSaving] = useTransition();

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    kind: "note" as MaterialKind,
    url: "",
    fileName: "",
    fileSize: 0,
    mimeType: "",
  });

  const reset = () =>
    setForm({
      title: "",
      description: "",
      kind: "note",
      url: "",
      fileName: "",
      fileSize: 0,
      mimeType: "",
    });

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "material");

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setForm((prev) => ({
        ...prev,
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        title: prev.title || data.fileName.replace(/\.[^.]+$/, ""),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    startSaving(async () => {
      const res = await createStudyMaterial({
        courseId,
        title: form.title,
        description: form.description || undefined,
        kind: form.kind,
        url: form.url,
        fileName: form.fileName || undefined,
        fileSize: form.fileSize || undefined,
        mimeType: form.mimeType || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }
      setSuccess("Material published to your enrolled students.");
      reset();
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
      router.refresh();
    });
  };

  const remove = (material: StudyMaterial) => {
    if (!window.confirm(`Delete “${material.title}”? Students will lose access.`)) return;
    startSaving(async () => {
      const res = await deleteStudyMaterial(material.id);
      if (!res.success) setError(res.error);
      else router.refresh();
    });
  };

  const isLink = form.kind === "link";

  return (
    <section className="rounded-3xl border border-surface-muted bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <Paperclip size={22} className="text-brand-600" />
            Study Material
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Notes, assignments and slides — visible only to students who bought this course.
          </p>
        </div>
        <button
          onClick={() => {
            setOpen((v) => !v);
            setSuccess("");
            setError("");
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-bold text-white shadow-glow transition-all hover:brightness-105"
        >
          {open ? <X size={16} /> : <Plus size={16} />}
          {open ? "Close" : "Add material"}
        </button>
      </div>

      <AnimatePresence>
        {success && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
          >
            <CheckCircle2 size={16} /> {success}
          </motion.p>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="mb-6 overflow-hidden"
          >
            <div className="grid gap-4 rounded-2xl border border-surface-muted bg-surface-subtle p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Unit 3 — Trees & Graphs (handwritten notes)"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={form.kind}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, kind: e.target.value as MaterialKind }))
                  }
                  className={inputCls}
                >
                  {KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>{isLink ? "Link" : "File"}</label>
                {isLink ? (
                  <div className="relative">
                    <Link2
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                    />
                    <input
                      value={form.url}
                      onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                      placeholder="https://…"
                      className={cn(inputCls, "pl-9")}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv,.md,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                      className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-brand-700"
                    />
                    {uploading && <Loader2 size={16} className="animate-spin text-brand-600" />}
                  </div>
                )}
                {!isLink && form.fileName && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={12} /> {form.fileName} attached
                  </p>
                )}
                {!isLink && (
                  <p className="mt-1 text-[11px] text-ink-muted">
                    PDF, Word, PowerPoint, Excel, ZIP, text or image — up to 4MB.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What should students do with this?"
                  className="w-full rounded-xl border border-surface-muted bg-white p-3 text-sm text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving || uploading || !form.url || !form.title.trim()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-glow transition-all hover:brightness-105 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {saving ? "Publishing…" : "Publish to students"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-surface-muted bg-surface-subtle px-6 py-14 text-center">
          <FileText size={34} className="text-ink-muted/50" />
          <h3 className="mt-3 font-display text-lg font-bold text-ink">No material yet</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            Upload your first set of notes — enrolled students see it instantly in their course.
          </p>
        </div>
      ) : (
        <MaterialList
          materials={materials}
          onDelete={remove}
          deleteDisabled={saving}
        />
      )}
    </section>
  );
}
