import { prisma } from "@/lib/db";
import type { License } from "@prisma/client";

export interface LicenseCheckResult {
  valid: true;
  enforced: false;
  license: License | null;
}

/**
 * Lisans doğrulaması şu an pasif: her zaman gecerli/kisitlamasiz doner.
 * Ileride gercek uygulama, `enforced` alanina bakan bir kontrol noktasi eklenerek acilir.
 */
export async function checkLicense(): Promise<LicenseCheckResult> {
  const license = await prisma.license.findFirst({ orderBy: { createdAt: "desc" } });
  return { valid: true, enforced: false, license };
}
