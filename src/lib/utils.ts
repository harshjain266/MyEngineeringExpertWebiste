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

/* ─── India Standard Time ───────────────────────────────────────
 *
 * Every class on this platform is scheduled and attended in IST, so IST is the
 * single source of truth for class times — not the server's timezone and not
 * the viewer's device.
 *
 * Two bugs this prevents:
 *   • On write, `new Date("2026-09-26T18:01")` (a `datetime-local` value, which
 *     carries no offset) is parsed in the *runtime's* zone. On a UTC production
 *     server an admin's 6:01 pm IST became 6:01 pm UTC — 11:31 pm IST.
 *   • On read, `toLocaleString` with no `timeZone` renders in the *viewer's*
 *     zone in the browser and in the *server's* zone during SSR, so the same
 *     class showed two different times.
 *
 * IST has no daylight saving, so the fixed +05:30 offset below is always right.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

/**
 * Turn a `datetime-local` form value ("2026-09-26T18:01") into an exact instant,
 * reading the wall-clock as IST rather than as the runtime's local time.
 * Returns an invalid Date for unparseable input so callers can check it.
 */
export function istInputToDate(value: string): Date {
  const trimmed = (value ?? "").trim();
  // Accept "YYYY-MM-DDTHH:mm" and "YYYY-MM-DDTHH:mm:ss".
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    // Anything already carrying a zone (a full ISO string) is taken as-is.
    return new Date(trimmed);
  }
  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  return new Date(`${withSeconds}${IST_OFFSET}`);
}

/** Render an instant as a `datetime-local` value in IST, for prefilling forms. */
export function toISTInputValue(input: Date | string | number): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  // `hour` can come back as "24" for midnight in some runtimes.
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** "05:00 pm" — always IST, whoever is looking. */
export function formatISTTime(input: Date | string): string {
  return new Date(input).toLocaleTimeString("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Fri, 26 Sep 2026" — always IST. Pass options to drop the weekday or year. */
export function formatISTDate(
  input: Date | string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Date(input).toLocaleDateString("en-IN", {
    timeZone: IST_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

/** "Fri, 26 Sep, 06:01 pm" — always IST. */
export function formatISTDateTime(
  input: Date | string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Date(input).toLocaleString("en-IN", {
    timeZone: IST_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/** True when the instant falls on today's date in IST. */
export function isISTToday(input: Date | string): boolean {
  const key = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: IST_TIME_ZONE });
  return key(new Date(input)) === key(new Date());
}

/* ─── Class schedule days ───────────────────────────────────── */

/** Stored keys for the weekdays a batch runs on. Order matters for display. */
export const CLASS_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type ClassDay = (typeof CLASS_DAYS)[number];

/** Single letter for the day pills in the admin form. */
export const CLASS_DAY_INITIALS: Record<ClassDay, string> = {
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
  Sun: "S",
};

/** Keep stored days in calendar order however they were clicked. */
export function sortClassDays(days: readonly string[]): ClassDay[] {
  return CLASS_DAYS.filter((d) => days.includes(d));
}

/**
 * "Mon, Wed & Fri" — or a shorthand when the set is a familiar one, since
 * "Every day" reads better than listing all seven.
 */
export function formatClassDays(days?: readonly string[] | null): string {
  const ordered = sortClassDays(days ?? []);
  if (ordered.length === 0) return "Schedule to be announced";
  if (ordered.length === 7) return "Every day";
  if (ordered.length === 6 && !ordered.includes("Sun")) return "Mon to Sat";
  if (ordered.length === 5 && !ordered.includes("Sat") && !ordered.includes("Sun")) {
    return "Mon to Fri";
  }
  if (ordered.length === 1) return ordered[0];
  return `${ordered.slice(0, -1).join(", ")} & ${ordered[ordered.length - 1]}`;
}

/** "05:00 pm" from a stored "17:00" wall clock. Returns "" for empty input. */
export function formatClockTime(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (hours < 0 || hours > 23) return value;
  const suffix = hours < 12 ? "am" : "pm";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(display).padStart(2, "0")}:${minutes} ${suffix}`;
}

/** "05:00 pm – 07:00 pm IST", or a single time, or a placeholder. */
export function formatClassWindow(
  start?: string | null,
  end?: string | null,
): string {
  const from = formatClockTime(start);
  const to = formatClockTime(end);
  if (from && to) return `${from} – ${to} IST`;
  if (from) return `${from} IST onwards`;
  return "Timing to be announced";
}
