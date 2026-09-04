/** Presentation helpers shared by the blog API, editor and reader pages. */

const WORDS_PER_MINUTE = 200;

/** Strip the TipTap HTML down to readable text. */
export function htmlToPlainText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimated reading time in whole minutes, never below 1. */
export function readingMinutes(html: string) {
  const words = htmlToPlainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Teaser text for cards, search results and meta descriptions. Falls back to
 * the opening of the post when the author did not write one.
 */
export function buildExcerpt(html: string, provided?: string | null, max = 180) {
  const source = provided?.trim() || htmlToPlainText(html);
  if (source.length <= max) return source;
  const clipped = source.slice(0, max);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}
