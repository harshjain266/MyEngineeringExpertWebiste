"use client";

import { useEffect } from "react";

export function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only track once per session
    if (sessionStorage.getItem("ee_tracked")) return;

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: window.location.pathname }),
    }).catch(() => {});

    sessionStorage.setItem("ee_tracked", "1");
  }, []);

  return null;
}
