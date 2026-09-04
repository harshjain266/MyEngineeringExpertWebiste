"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryFormProps {
  userType?: "student" | "instructor";
}

const QUERY_CATEGORIES = [
  "Course Related",
  "Payment Issue",
  "Technical Problem",
  "Account Issue",
  "Live Class Issue",
  "Refund Request",
  "Other",
];

export function QueryForm({ userType = "student" }: QueryFormProps) {
  const { data: session } = useSession();
  const [category, setCategory] = useState(QUERY_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject,
          message,
          userType,
          userName: session?.user?.name,
          userEmail: session?.user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send query");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-ink">Query Sent Successfully!</h3>
        <p className="mt-1 text-sm text-ink-muted">
          We&apos;ve received your query and will respond to your email at{' '}
          <span className="font-semibold text-ink">{session?.user?.email}</span> within 24 hours.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setSent(false);
            setSubject("");
            setMessage("");
            setCategory(QUERY_CATEGORIES[0]);
          }}
        >
          Send Another Query
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 w-full rounded-xl border border-surface-muted bg-white px-4 text-sm text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
        >
          {QUERY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          className="h-11 w-full rounded-xl border border-surface-muted bg-white px-4 text-sm text-ink placeholder-ink-muted outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your query in detail..."
          rows={5}
          className="w-full rounded-xl border border-surface-muted bg-white px-4 py-3 text-sm text-ink placeholder-ink-muted outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-500">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <Send size={16} className="mr-2" />
            Send Query
          </>
        )}
      </Button>
    </form>
  );
}
