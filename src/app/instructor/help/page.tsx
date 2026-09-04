import type { Metadata } from "next";
import { HelpCircle, Mail, Clock, MessageSquare } from "lucide-react";
import { QueryForm } from "@/components/support/query-form";

export const metadata: Metadata = { title: "Help & Support" };

export default function InstructorHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <HelpCircle size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Help & Support</h1>
            <p className="text-sm text-ink-muted">
              Need assistance with your instructor account or courses? Reach out to us.
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-surface-muted bg-white p-5 shadow-soft">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Mail size={18} />
          </div>
          <h3 className="font-display text-sm font-bold text-ink">Email Us</h3>
          <p className="mt-1 text-xs text-ink-muted">
            myengineeringexpert1@gmail.com
          </p>
        </div>
        <div className="rounded-2xl border border-surface-muted bg-white p-5 shadow-soft">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Clock size={18} />
          </div>
          <h3 className="font-display text-sm font-bold text-ink">Response Time</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Priority support within 12 hours
          </p>
        </div>
        <div className="rounded-2xl border border-surface-muted bg-white p-5 shadow-soft">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <MessageSquare size={18} />
          </div>
          <h3 className="font-display text-sm font-bold text-ink">Support Hours</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Mon - Sat, 9:00 AM - 8:00 PM
          </p>
        </div>
      </div>

      {/* Query Form */}
      <div className="rounded-3xl border border-surface-muted bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-ink">Send Us a Query</h2>
          <p className="mt-1 text-sm text-ink-muted">
            As an instructor, your queries receive priority support. We&apos;ll respond within 12 hours.
          </p>
        </div>
        <QueryForm userType="instructor" />
      </div>

      {/* Instructor Resources */}
      <div className="rounded-3xl border border-surface-muted bg-white p-6 shadow-soft sm:p-8">
        <h2 className="mb-6 font-display text-xl font-bold text-ink">Instructor Resources</h2>
        <div className="space-y-4">
          {[
            {
              q: "How do I create a live class?",
              a: "Go to your batch page and click 'Schedule Class'. Fill in the details and meeting URL.",
            },
            {
              q: "How do I update my profile?",
              a: "Navigate to 'Public Profile' in the sidebar. You can update your bio, qualifications, and more.",
            },
            {
              q: "How do I add a new blog post?",
              a: "Click 'My Blogs' then 'New Post'. Use the editor to write and publish your content.",
            },
            {
              q: "How do I view my assigned students?",
              a: "Go to 'My Batches' and click on a batch to see all enrolled students.",
            },
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-surface-muted bg-surface-subtle p-4">
              <h4 className="font-semibold text-ink">{faq.q}</h4>
              <p className="mt-1 text-sm text-ink-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
