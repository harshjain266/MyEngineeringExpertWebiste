import "server-only";

import crypto from "node:crypto";

/**
 * Cloudinary uploads.
 *
 * Files used to be inlined into Postgres as base64 `data:` URLs, which made the
 * database grow with every PDF and image. Here the bytes go to Cloudinary and
 * only the resulting https URL is stored — a row holds a pointer, not a file.
 *
 * Talks to the REST API directly rather than pulling in the SDK: one signed
 * POST is the whole protocol, and it keeps the dependency list short.
 *
 * Configure with:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   CLOUDINARY_UPLOAD_FOLDER  (optional, defaults to "engineering-expert")
 *
 * When unset, `isCloudinaryConfigured()` is false and callers fall back to the
 * old data-URL behaviour, so nothing breaks before the keys are added.
 */

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) return null;

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "engineering-expert",
  };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

/** Cloudinary signs the alphabetically sorted params, secret appended. */
function sign(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export interface CloudinaryUpload {
  url: string;
  publicId: string;
  bytes: number;
  format?: string;
}

/**
 * Upload one file and return its delivery URL.
 *
 * `resource_type: auto` lets Cloudinary classify images, PDFs and documents
 * itself; PDFs and other non-media land as `raw`/`image` accordingly.
 */
export async function uploadToCloudinary(
  file: File,
  options: { folder?: string } = {},
): Promise<CloudinaryUpload> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error("Cloudinary is not configured on this environment.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = options.folder ?? config.folder;
  const signature = sign({ folder, timestamp }, config.apiSecret);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", config.apiKey);
  body.append("timestamp", timestamp);
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
    { method: "POST", body },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.secure_url) {
    const reason = data?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Cloudinary upload failed: ${reason}`);
  }

  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    bytes: Number(data.bytes ?? 0),
    format: data.format as string | undefined,
  };
}

/** True for a URL actually served by Cloudinary (used to validate pasted links). */
export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}
