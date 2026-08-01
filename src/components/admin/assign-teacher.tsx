"use client";

import { useState } from "react";

/**
 * Superadmin-only control to hand a teacher over to an admin account
 * (or unassign them). Rendered inside each instructor row.
 */
export function AssignTeacher({
  instructorId,
  currentAdminId,
  admins,
  onAssigned,
}: {
  instructorId: string;
  currentAdminId?: string | null;
  admins: { id: string; name: string }[];
  onAssigned: (instructorId: string, adminId: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (value: string) => {
    const next = value === "" ? null : value;
    if (next === currentAdminId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/assign-instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorIds: [instructorId], adminId: next }),
      });
      if (!res.ok) throw new Error("Assign failed");
      onAssigned(instructorId, next);
    } catch {
      alert("Failed to assign teacher");
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={currentAdminId ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving || admins.length === 0}
      title="Assign to admin"
      className="h-8 rounded-lg border border-surface-muted bg-white px-2 text-xs font-medium text-ink outline-none focus:border-brand-300 disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {admins.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
