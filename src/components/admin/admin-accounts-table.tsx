"use client";

import { Calendar, Mail, Phone, ShieldCheck, Users } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn, formatDate } from "@/lib/utils";
import type { AdminAccount } from "@/types";

export function AdminAccountsTable({
  admins,
  onToggle,
  toggleLoading,
}: {
  admins: AdminAccount[];
  onToggle: (id: string, disabled: boolean) => void;
  toggleLoading: Set<string>;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <ShieldCheck size={18} className="text-brand-600" />
          Admin Accounts
        </h2>
      </div>
      <div className="divide-y divide-surface-muted">
        {admins.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">No admins found.</div>
        ) : (
          admins.map((a) => {
            const isToggling = toggleLoading.has(`admin-${a.id}`);
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold",
                      a.isDisabled
                        ? "bg-rose-50 text-rose-400"
                        : "bg-violet-50 text-violet-700",
                    )}
                  >
                    {a.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{a.name}</p>
                      {a.isDisabled && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Mail size={11} /> {a.email}
                      </span>
                      {a.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} /> {a.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {a.instructorCount} teachers
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(a.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isToggling ? (
                    <div className="h-6 w-11 animate-pulse rounded-full bg-surface-muted" />
                  ) : (
                    <ToggleSwitch
                      checked={!a.isDisabled}
                      onChange={(checked) => onToggle(a.id, !checked)}
                    />
                  )}
                  <span className="w-14 text-xs font-medium text-ink-muted">
                    {a.isDisabled ? "Disabled" : "Active"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
