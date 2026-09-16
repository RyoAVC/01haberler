import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const IMAGE_ALLOWLIST_KEY = "image_allowlist_domains";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export async function getImageAllowlistDomains(): Promise<string[]> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: IMAGE_ALLOWLIST_KEY } });
  const stored = setting && isStringArray(setting.value) ? setting.value : [];
  const fromEnv = env.IMAGE_ALLOWLIST_DOMAINS;
  return Array.from(new Set([...stored, ...fromEnv]));
}

export async function addImageAllowlistDomainInternal(domain: string): Promise<void> {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return;

  const setting = await prisma.siteSetting.findUnique({ where: { key: IMAGE_ALLOWLIST_KEY } });
  const current = setting && isStringArray(setting.value) ? setting.value : [];
  if (current.includes(normalized)) return;

  const next = [...current, normalized];
  await prisma.siteSetting.upsert({
    where: { key: IMAGE_ALLOWLIST_KEY },
    update: { value: next },
    create: { key: IMAGE_ALLOWLIST_KEY, value: next },
  });
}
