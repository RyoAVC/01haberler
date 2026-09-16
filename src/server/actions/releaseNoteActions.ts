"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import type { ReleaseChangeType } from "@prisma/client";

const CHANGE_TYPES: ReleaseChangeType[] = ["FEATURE", "FIX", "IMPROVEMENT", "SECURITY"];

async function requireChangelogManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "changelog:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

function parseItems(raw: string): { changeType: ReleaseChangeType; description: string; sortOrder: number }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^([A-Z]+):\s*(.+)$/);
      const typeCandidate = match?.[1] as ReleaseChangeType | undefined;
      const changeType = typeCandidate && CHANGE_TYPES.includes(typeCandidate) ? typeCandidate : "FEATURE";
      const description = match ? (match[2] ?? line) : line;
      return { changeType, description, sortOrder: index };
    });
}

export async function saveReleaseNote(formData: FormData): Promise<void> {
  const user = await requireChangelogManager();

  const version = String(formData.get("version") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const isDraft = formData.get("isDraft") === "on";
  const itemsRaw = String(formData.get("items") ?? "");

  if (!version || !title) throw new Error("Sürüm numarası ve başlık gerekli");

  const items = parseItems(itemsRaw);

  await prisma.releaseNote.upsert({
    where: { version },
    update: {
      title,
      isDraft,
      items: { deleteMany: {}, create: items },
    },
    create: {
      version,
      title,
      isDraft,
      createdById: user.id,
      items: { create: items },
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "RELEASE_NOTE_UPSERT", entityType: "ReleaseNote", entityId: version },
  });

  revalidatePath("/admin/surumler");
  revalidatePath("/degisiklik-notlari");
}

export async function deleteReleaseNoteAction(id: string): Promise<void> {
  const user = await requireChangelogManager();
  await prisma.releaseNote.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "RELEASE_NOTE_DELETE", entityType: "ReleaseNote", entityId: id },
  });
  revalidatePath("/admin/surumler");
}
