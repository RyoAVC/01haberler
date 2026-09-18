import { prisma } from "@/lib/db";

export type ModuleKey =
  | "comments"
  | "polls"
  | "push"
  | "socialAutoPost"
  | "redirects"
  | "weather"
  | "currency"
  | "aiAutoPublish";

export const MODULE_FLAGS_KEY = "module_flags";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  comments: "Yorumlar",
  polls: "Anketler",
  push: "Push Bildirimleri",
  socialAutoPost: "Sosyal Medya Otomatik Paylaşım",
  redirects: "301 Yönlendirmeler",
  weather: "Hava Durumu",
  currency: "Döviz Kuru",
  aiAutoPublish: "AI Kaynak Düzenleme + Otomatik Yayın",
};

export const DEFAULT_MODULE_FLAGS: Record<ModuleKey, boolean> = {
  comments: false,
  polls: false,
  push: false,
  socialAutoPost: false,
  redirects: true,
  weather: false,
  currency: false,
  aiAutoPublish: false,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getModuleFlags(): Promise<Record<ModuleKey, boolean>> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: MODULE_FLAGS_KEY } });
  if (!setting || !isPlainObject(setting.value)) return DEFAULT_MODULE_FLAGS;

  // Onceki surumlerde eklenmemis yeni modul anahtarlari icin varsayilanla
  // birlestir - eksik anahtar yuzunden tum kaydin sifirlanmasini onler.
  const stored = setting.value;
  const merged = { ...DEFAULT_MODULE_FLAGS };
  for (const key of Object.keys(DEFAULT_MODULE_FLAGS) as ModuleKey[]) {
    if (typeof stored[key] === "boolean") merged[key] = stored[key];
  }
  return merged;
}

export async function isModuleEnabled(key: ModuleKey): Promise<boolean> {
  const flags = await getModuleFlags();
  return flags[key];
}
