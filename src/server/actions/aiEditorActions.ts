"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { suggestExcerpt, suggestSeoMeta } from "@/server/services/aiEditorService";

async function requireWriter() {
  const user = await getCurrentUser();
  if (!user || !(hasPermission(user.role, "article:create") || hasPermission(user.role, "article:edit:own"))) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
}

export async function suggestExcerptAction(title: string, contentText: string) {
  await requireWriter();
  return suggestExcerpt(title, contentText);
}

export async function suggestSeoMetaAction(title: string, contentText: string) {
  await requireWriter();
  return suggestSeoMeta(title, contentText);
}
