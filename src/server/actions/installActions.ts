"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { isInstalled, markInstalled } from "@/server/services/installStatusService";

export interface CompleteInstallationInput {
  siteName: string;
  siteMetaDescription: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function completeInstallation(input: CompleteInstallationInput): Promise<{ error?: string }> {
  if (await isInstalled()) {
    return { error: "Kurulum zaten tamamlanmış" };
  }

  if (!input.adminEmail || input.adminPassword.length < 8) {
    return { error: "Geçerli bir e-posta ve en az 8 karakterli bir şifre girin" };
  }

  const passwordHash = await hashPassword(input.adminPassword);

  await prisma.user.upsert({
    where: { email: input.adminEmail },
    update: { passwordHash, name: input.adminName, role: "SUPER_ADMIN" },
    create: { email: input.adminEmail, passwordHash, name: input.adminName, role: "SUPER_ADMIN" },
  });

  await prisma.siteSetting.upsert({
    where: { key: "site_meta_description" },
    update: { value: input.siteMetaDescription },
    create: { key: "site_meta_description", value: input.siteMetaDescription },
  });

  await markInstalled();

  await prisma.auditLog.create({
    data: { userId: null, action: "INSTALL_COMPLETE", entityType: "SiteSetting", entityId: "installed" },
  });

  return {};
}
