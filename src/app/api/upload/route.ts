import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";

/**
 * Small-file upload endpoint.
 *
 * Files come back as data URLs rather than object-storage keys — the same
 * approach the blog editor already relies on. That keeps deploys dependency
 * free but puts the bytes in Postgres, so the size caps below are deliberately
 * tight. Swap this for S3/R2 before raising them.
 */

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/avif",
];

const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
  "text/csv",
  "text/markdown",
];

const MAX_SIZE = 4 * 1024 * 1024;

type UploadKind = "image" | "material";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "instructor" && !canAccessAdmin(user))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const kind = (formData.get("kind") as UploadKind | null) ?? "image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = kind === "material" ? [...IMAGE_TYPES, ...DOCUMENT_TYPES] : IMAGE_TYPES;

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            kind === "material"
              ? "Unsupported file. Accepted: PDF, Word, PowerPoint, Excel, ZIP, text and images."
              : "Invalid file type. Accepted: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
