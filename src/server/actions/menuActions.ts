"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { getFooterLinks, FOOTER_LINKS_KEY, type FooterLink } from "@/server/services/footerLinksService";

async function requireSettingsManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

async function saveFooterLinks(links: FooterLink[], userId: string): Promise<void> {
  const value = links as unknown as Prisma.InputJsonValue;
  await prisma.siteSetting.upsert({
    where: { key: FOOTER_LINKS_KEY },
    update: { value, updatedById: userId },
    create: { key: FOOTER_LINKS_KEY, value, updatedById: userId },
  });
  revalidatePath("/admin/menu");
  revalidatePath("/", "layout");
}

export async function addFooterLink(formData: FormData): Promise<void> {
  const user = await requireSettingsManager();

  const label = String(formData.get("label") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  if (!label || !href) throw new Error("Etiket ve bağlantı gerekli");
  if (!href.startsWith("/") && !href.startsWith("https://")) {
    throw new Error("Bağlantı '/' ile başlayan bir site içi yol veya https:// ile başlayan tam bir adres olmalı");
  }

  const links = await getFooterLinks();
  await saveFooterLinks([...links, { label, href }], user.id);

  await prisma.auditLog.create({
    data: { userId: user.id, action: "FOOTER_LINK_ADD", entityType: "SiteSetting", entityId: FOOTER_LINKS_KEY },
  });
}

export async function removeFooterLink(index: number): Promise<void> {
  const user = await requireSettingsManager();
  const links = await getFooterLinks();
  await saveFooterLinks(links.filter((_, i) => i !== index), user.id);

  await prisma.auditLog.create({
    data: { userId: user.id, action: "FOOTER_LINK_REMOVE", entityType: "SiteSetting", entityId: FOOTER_LINKS_KEY },
  });
}

export async function moveFooterLink(index: number, direction: "up" | "down"): Promise<void> {
  const user = await requireSettingsManager();
  const links = await getFooterLinks();
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= links.length) return;

  const reordered = [...links];
  const [moved] = reordered.splice(index, 1);
  if (!moved) return;
  reordered.splice(targetIndex, 0, moved);

  await saveFooterLinks(reordered, user.id);
}
