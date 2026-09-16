import { prisma } from "@/lib/db";
export const HOME_SETTINGS_KEY = "home_vitrine_v1";
export interface HomeSettings { headlineIds: string[]; campaignsEnabled: boolean }
export function parseHomeSettings(value: unknown): HomeSettings {
  const v = value as Partial<HomeSettings> | null;
  return { headlineIds: Array.isArray(v?.headlineIds) ? v.headlineIds.slice(0, 3).map(id => typeof id === "string" ? id : "") : [], campaignsEnabled: v?.campaignsEnabled !== false };
}
export async function getHomeSettings() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: HOME_SETTINGS_KEY } });
  return parseHomeSettings(setting?.value);
}
