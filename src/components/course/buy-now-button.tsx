"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/auth-modal";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, cb: () => void): void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export interface CoursePaymentProps {
  courseId: string;
  courseTitle: string;
  amount: number;
  planName?: string;
}

export function BuyNowButton({
  children = "Buy Now",
  redirectTo = "/dashboard",
  course,
  ...props
}: ButtonProps & { redirectTo?: string; course?: CoursePaymentProps }) {
  const { data: session, status } = useSession();
  const { open } = useAuthModal();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (status !== "authenticated") {
      const here = typeof window !== "undefined" ? window.location.pathname : redirectTo;
      open({ redirectTo: here });
      return;
    }

    // No course data → just navigate (used for generic CTAs)
    if (!course) {
      setPending(true);
      router.push(redirectTo);
      return;
    }

    setPending(true);
    setError("");

    try {
      /* COMMENTED OUT RAZORPAY FRONTEND FOR TESTING
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Could not load payment gateway. Check your connection.");
        return;
      }
      */

      // 2. Create order on server
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          amount: course.amount,
          planName: course.planName ?? "Batch",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not initiate payment");
        return;
      }

      // 3. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Could not load payment gateway. Check your connection.");
        return;
      }

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "EngineeringExpert",
        description: `${course.planName ?? "Batch"} — ${course.courseTitle}`,
        order_id: data.orderId,
        prefill: {
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
        },
        theme: { color: "#4F46E5" },
        handler: async (response: RazorpayResponse) => {
          // 5. Verify on server
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.ok) {
            router.push("/dashboard/my-courses");
            router.refresh();
          } else {
            setError("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => setPending(false),
        },
      });

      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      // Keep spinner while Razorpay modal is open; ondismiss clears it
      if (!course) setPending(false);
    }
  };

  return (
    <span className="flex flex-col gap-1">
      <Button onClick={handleClick} disabled={pending || status === "loading"} {...props}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : children}
      </Button>
      {error && <span className="text-[11px] text-rose-500">{error}</span>}
    </span>
  );
}
