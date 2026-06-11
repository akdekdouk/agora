import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // Prevent path traversal
  const safe = path.basename(filename);
  const filePath = path.join("/tmp", "uploads", safe);

  try {
    const buffer = await readFile(filePath);
    const ext = safe.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      ext === "gif" ? "image/gif" :
      "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
