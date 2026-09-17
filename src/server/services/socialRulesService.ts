import { prisma } from "@/lib/db";

export const SOCIAL_RULES_KEY = "social_rules_v1";

export interface SocialRules {
  quietStartHour: number | null; // 0-23; null => sessiz saat kapali
  quietEndHour: number | null;
  allowedCategoryIds: string[]; // bos => tum kategoriler paylasilir
}

function normHour(x: unknown): number | null {
  return typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 23 ? x : null;
}

export function parseSocialRules(value: unknown): SocialRules {
  const v = value as Partial<SocialRules> | null;
  return {
    quietStartHour: normHour(v?.quietStartHour),
    quietEndHour: normHour(v?.quietEndHour),
    allowedCategoryIds: Array.isArray(v?.allowedCategoryIds)
      ? v.allowedCategoryIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

// Sessiz saat penceresi. start<end ise ayni gun icinde (or 01-06); start>end ise
// gece devri (or 22-06). Degerlerden biri null veya esitse pencere yok.
export function isWithinQuietHours(hour: number, start: number | null, end: number | null): boolean {
  if (start === null || end === null || start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

export function isSocialPostingAllowed(input: {
  hour: number;
  categoryId: string;
  rules: SocialRules;
}): boolean {
  const { hour, categoryId, rules } = input;
  if (isWithinQuietHours(hour, rules.quietStartHour, rules.quietEndHour)) return false;
  if (rules.allowedCategoryIds.length > 0 && !rules.allowedCategoryIds.includes(categoryId)) return false;
  return true;
}

export function currentIstanbulHour(now: Date = new Date()): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    hour: "numeric",
    hour12: false,
  }).format(now);
  const hour = parseInt(formatted, 10);
  return hour === 24 ? 0 : hour;
}

export async function getSocialRules(): Promise<SocialRules> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: SOCIAL_RULES_KEY } });
  return parseSocialRules(setting?.value);
}
