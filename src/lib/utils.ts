import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (dedupes conflicting utilities). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer rupee amount as ₹1,499. */
export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "12.5k", "1.2M" style compact numbers for social proof counters. */
export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Percentage discount between original and sale price. */
export function discountPct(price: number, original: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

/** Format a date string consistently (avoids hydration mismatch from toLocaleDateString). */
export function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Image-source guards.
 *
 * `next/image` warns (and refetches the whole page) when `src` is an empty
 * string, and several DB columns behind these images are nullable even though
 * older types claimed otherwise. Route every `<Image src>` through one of these.
 */

/** Inline SVG placeholder — no network request, works offline and in emails. */
export const COURSE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#eef2ff"/><stop offset="100%" stop-color="#e0e7ff"/>
      </linearGradient></defs>
      <rect width="640" height="360" fill="url(#g)"/>
      <g fill="none" stroke="#a5b4fc" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
        <path d="M250 150h140v90H250z"/><path d="M250 150l70-40 70 40"/>
      </g>
    </svg>`,
  );

/** Course/lesson artwork with a safe fallback. */
export function courseImage(thumbnail?: string | null) {
  return thumbnail && thumbnail.trim() ? thumbnail : COURSE_PLACEHOLDER;
}

/** Avatar with a deterministic fallback derived from the person's name. */
export function avatarImage(avatar?: string | null, seed = "user") {
  if (avatar && avatar.trim()) return avatar;
  return `https://i.pravatar.cc/160?u=${encodeURIComponent(seed)}`;
}

/**
 * Email-format guard shared by every sign-in / sign-up surface.
 *
 * Deliberately stricter than `<input type="email">`, which happily accepts
 * "name@example" (no dot, no TLD). Those values used to reach the server and
 * come back as a generic failure, so the check runs here first and the caller
 * shows `EMAIL_FORMAT_ERROR` instead.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export const EMAIL_FORMAT_ERROR =
  "That email address doesn't look right. Use a format like name@example.com.";
