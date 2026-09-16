"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";

async function requireLicenseViewer() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "license:view-hidden")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function saveLicenseAction(id: string | null, formData: FormData): Promise<void> {
  await requireLicenseViewer();

  const data = {
    licenseKey: String(formData.get("licenseKey") ?? "").trim(),
    ownerLegalName: String(formData.get("ownerLegalName") ?? "").trim(),
    productName: String(formData.get("productName") ?? "AvcHaberSoft").trim(),
    issuedTo: (formData.get("issuedTo") as string) || null,
    domain: (formData.get("domain") as string) || null,
    isActive: formData.get("isActive") === "on",
  };

  if (!data.licenseKey || !data.ownerLegalName) {
    throw new Error("Lisans anahtarı ve lisans sahibi zorunludur");
  }

  if (id) {
    await prisma.license.update({ where: { id }, data });
  } else {
    await prisma.license.create({ data });
  }

  revalidatePath("/admin/lisans-detay");
}
