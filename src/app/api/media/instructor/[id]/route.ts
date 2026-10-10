import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Serves an instructor's stored avatar as a real image response.
 *
 * Avatars uploaded before Cloudinary are held as base64 `data:` URLs. Embedding
 * those in list payloads shipped 585 KB of images to the landing page for eight
 * cards — and a data URL can never be lazy-loaded or cached, because it *is*
 * the HTML. Behind this route the browser gets a normal URL it can defer,
 * cache, and skip entirely when the image is off-screen.
 *
 * Cloudinary-hosted avatars never reach here: those are already URLs and are
 * passed through to the CDN directly.
 */

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Decode "data:image/png;base64,AAAA" into bytes + content type. */
function decodeDataUrl(value: string) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(value);
  if (!match) return null;
  const [, contentType, isBase64, payload] = match;
  const body = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { contentType, body };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const instructor = await prisma.instructor
    .findUnique({ where: { id }, select: { avatar: true } })
    .catch(() => null);

  const avatar = instructor?.avatar;
  if (!avatar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already a hosted URL (Cloudinary, gravatar…) — send the caller there.
  if (!avatar.startsWith("data:")) {
    return NextResponse.redirect(avatar, 308);
  }

  const decoded = decodeDataUrl(avatar);
  if (!decoded) {
    return NextResponse.json({ error: "Unreadable image" }, { status: 422 });
  }

  return new NextResponse(new Uint8Array(decoded.body), {
    headers: {
      "Content-Type": decoded.contentType,
      "Content-Length": String(decoded.body.length),
      // Immutable in practice: a changed avatar changes the row, and the ?v=
      // cache-buster the helper appends changes the URL with it.
      "Cache-Control": `public, max-age=${ONE_YEAR}, immutable`,
    },
  });
}
