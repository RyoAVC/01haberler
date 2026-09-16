import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:create")) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Yalnızca JPEG, PNG, WEBP veya GIF yükleyebilirsiniz" }, { status: 400 });
  }

  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `Dosya boyutu ${env.MAX_UPLOAD_MB}MB sınırını aşıyor` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Dosya icerigi de beyan edilen MIME turuyle eslesmeli (magic byte kontrolu);
  // yalnizca uzantiya/Content-Type basligina guvenmek sahte dosya yuklemeye acik kapi birakir.
  if (!matchesDeclaredType(buffer, file.type)) {
    return NextResponse.json({ error: "Dosya içeriği beyan edilen türle eşleşmiyor" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  const media = await prisma.media.create({
    data: {
      url: `/uploads/${filename}`,
      originalFilename: file.name.slice(0, 200),
      mimeType: file.type,
      sizeBytes: file.size,
      source: "UPLOAD",
      uploadedById: user.id,
    },
  });

  return NextResponse.json({ id: media.id, url: media.url });
}

function matchesDeclaredType(buffer: Buffer, mimeType: string): boolean {
  const bytes = buffer.subarray(0, 12);
  switch (mimeType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8;
    case "image/png":
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    case "image/gif":
      return bytes.toString("ascii", 0, 3) === "GIF";
    case "image/webp":
      return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    default:
      return false;
  }
}
