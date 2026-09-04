import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { getUserOrders } from "@/lib/data";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Orders" };

const STATUS_CONFIG = {
  Success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Paid" },
  Pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
  Failed: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", label: "Failed" },
} as const;

export default async function OrdersPage() {
  const orders = await getUserOrders();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">My Orders</h1>
            <p className="text-sm text-ink-muted">
              {orders.length} order{orders.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="rounded-3xl border border-surface-muted bg-white p-12 text-center shadow-soft">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-muted text-ink-muted">
            <ShoppingBag size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No orders yet</h3>
          <p className="mt-1 text-sm text-ink-muted">
            When you purchase a course, your orders will appear here.
          </p>
          <Link
            href="/dashboard/browse"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-surface-muted bg-white shadow-soft transition-shadow hover:shadow-card"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 font-display text-lg font-bold text-brand-700">
                      {order.course[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold text-ink">
                        {order.course}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                        {order.planName && (
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-medium">
                            {order.planName}
                          </span>
                        )}
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="font-mono text-[10px] text-ink-muted/70">
                          ID: {order.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-ink">
                        {formatINR(order.amount)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.bg} ${status.color}`}>
                      <StatusIcon size={13} />
                      {status.label}
                    </div>
                  </div>
                </div>

                {/* Expandable details */}
                <div className="border-t border-surface-muted bg-surface-subtle/30 px-5 py-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ink-muted">
                    {order.razorpayOrderId && (
                      <span>
                        <span className="font-semibold">Order ID:</span> {order.razorpayOrderId}
                      </span>
                    )}
                    {order.razorpayPaymentId && (
                      <span>
                        <span className="font-semibold">Payment ID:</span> {order.razorpayPaymentId}
                      </span>
                    )}
                    <span>
                      <span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
