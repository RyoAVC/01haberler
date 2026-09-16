import { prisma } from "@/lib/db";

export const INSTALL_STATUS_KEY = "installed";

export async function isInstalled(): Promise<boolean> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: INSTALL_STATUS_KEY } });
  const value = setting?.value as { installed?: boolean } | undefined;
  return value?.installed === true;
}

export async function markInstalled(): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: INSTALL_STATUS_KEY },
    update: { value: { installed: true, installedAt: new Date().toISOString() } },
    create: { key: INSTALL_STATUS_KEY, value: { installed: true, installedAt: new Date().toISOString() } },
  });
}
