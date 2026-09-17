import { prisma } from "@/lib/db";
import type { HeadlineWindow } from "@/lib/utils/headlineSchedule";
export const HOME_SETTINGS_KEY = "home_vitrine_v1";
export interface HomeSettings { headlineIds: string[]; campaignsEnabled: boolean; windows?: HeadlineWindow[] }
export function parseHomeSettings(value: unknown): HomeSettings {
  const v = value as Partial<HomeSettings> | null;
  return { headlineIds: Array.isArray(v?.headlineIds) ? v.headlineIds.slice(0, 3).map(id => typeof id === "string" ? id : "") : [], campaignsEnabled: v?.campaignsEnabled !== false,
    ...(Array.isArray(v?.windows) ? { windows: v.windows.slice(0, 3).map(w => ({ startAt: typeof w?.startAt === "string" ? w.startAt : null, endAt: typeof w?.endAt === "string" ? w.endAt : null })) } : {}) };
}
export async function getHomeSettings() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: HOME_SETTINGS_KEY } });
  return parseHomeSettings(setting?.value);
}
