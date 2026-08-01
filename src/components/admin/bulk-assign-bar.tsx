"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

/**
 * Superadmin-only toolbar shown when teachers are multi-selected.
 * Assigns every selected teacher to one admin (or unassigns them all).
 */
export function BulkAssignBar({
  count,
  admins,
  onApply,
  onClear,
}: {
  count: number;
  admins: { id: string; name: string }[];
  onApply: (adminId: string | null) => Promise<void>;
  onClear: () => void;
}) {
  const [adminId, setAdminId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleApply = async () => {
    const next = adminId === "" ? null : adminId;
    setSaving(true);
    try {
      await onApply(next);
    } catch {
      // error surfaced by the parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3 shadow-soft">
      <span className="text-sm font-bold text-ink">
        {count} teacher{count !== 1 ? "s" : ""} selected
      </span>
      <select
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        disabled={saving || admins.length === 0}
        className="h-9 rounded-lg border border-surface-muted bg-white px-2 text-xs font-medium text-ink outline-none focus:border-brand-300 disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {admins.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleApply}
        disabled={saving || admins.length === 0}
        className="flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition-all hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Check size={12} />
        )}
        Assign
      </button>
      <button
        onClick={onClear}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg border border-surface-muted bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
}
