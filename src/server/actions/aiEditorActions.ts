"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { suggestExcerpt, suggestSeoMeta, suggestHeadlineTags } from "@/server/services/aiEditorService";
import { rateLimit } from "@/lib/security/rateLimit";

async function requireWriter() {
  const user = await getCurrentUser();
  if (!user || !(hasPermission(user.role, "article:create") || hasPermission(user.role, "article:edit:own"))) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  const limit = await rateLimit(`ai-editor:${user.id}`, 20, 3600);
  if (!limit.allowed) throw new Error("Saatlik 20 AI önerisi sınırına ulaştınız.");
}

export async function suggestExcerptAction(title: string, contentText: string) {
  await requireWriter();
  return suggestExcerpt(title.slice(0, 200), contentText.slice(0, 4000));
}

export async function suggestSeoMetaAction(title: string, contentText: string) {
  await requireWriter();
  return suggestSeoMeta(title.slice(0, 200), contentText.slice(0, 4000));
}

export async function suggestHeadlineTagsAction(title: string, contentText: string) {
  await requireWriter();
  return suggestHeadlineTags(title, contentText);
}
