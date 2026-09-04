"use client";

import {
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Presentation,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialKind, StudyMaterial } from "@/types";

const KIND_META: Record<MaterialKind, { label: string; icon: LucideIcon; cls: string }> = {
  note: { label: "Notes", icon: FileText, cls: "bg-brand-50 text-brand-700" },
  assignment: { label: "Assignment", icon: ClipboardList, cls: "bg-amber-50 text-amber-700" },
  slide: { label: "Slides", icon: Presentation, cls: "bg-violet-50 text-violet-700" },
  reference: { label: "Reference", icon: FileText, cls: "bg-slate-100 text-slate-700" },
  link: { label: "Link", icon: Link2, cls: "bg-emerald-50 text-emerald-700" },
};

function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  materials: StudyMaterial[];
  /** Provided only on the teacher view. */
  onDelete?: (material: StudyMaterial) => void;
  deleteDisabled?: boolean;
  /** Show which course each file belongs to (cross-course listings). */
  showCourse?: boolean;
}

export function MaterialList({
  materials,
  onDelete,
  deleteDisabled,
  showCourse,
}: Props) {
  return (
    <ul className="grid gap-3">
      {materials.map((m) => {
        const meta = KIND_META[m.kind] ?? KIND_META.note;
        const Icon = meta.icon;
        const isExternal = m.kind === "link";
        const size = formatSize(m.fileSize);

        return (
          <li
            key={m.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-surface-muted bg-white p-4 transition-colors hover:border-brand-200"
          >
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                meta.cls,
              )}
            >
              <Icon size={20} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-ink">{m.title}</p>
                <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {meta.label}
                </span>
              </div>
              {m.description && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{m.description}</p>
              )}
              {showCourse && m.courseTitle && (
                <p className="mt-1 truncate text-xs font-semibold text-brand-700">
                  {m.courseTitle}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-muted">
                {m.uploadedByName} ·{" "}
                {new Date(m.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {size ? ` · ${size}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                {...(isExternal ? {} : { download: m.fileName ?? m.title })}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-50 px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100"
              >
                {isExternal ? (
                  <>
                    Open <ExternalLink size={15} />
                  </>
                ) : (
                  <>
                    Download <Download size={15} />
                  </>
                )}
              </a>

              {onDelete && (
                <button
                  onClick={() => onDelete(m)}
                  disabled={deleteDisabled}
                  title="Delete material"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-surface-muted text-ink-muted transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
