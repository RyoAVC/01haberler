"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { MODULE_FLAGS_KEY, DEFAULT_MODULE_FLAGS, type ModuleKey } from "@/server/services/moduleFlagsService";

export async function updateModuleFlags(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "modules:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }

  const value = Object.fromEntries(
    (Object.keys(DEFAULT_MODULE_FLAGS) as ModuleKey[]).map((key) => [key, formData.get(key) === "on"])
  );

  await prisma.siteSetting.upsert({
    where: { key: MODULE_FLAGS_KEY },
    update: { value, updatedById: user.id },
    create: { key: MODULE_FLAGS_KEY, value, updatedById: user.id },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "MODULE_FLAGS_UPDATE", entityType: "SiteSetting", entityId: MODULE_FLAGS_KEY },
  });

  revalidatePath("/admin/moduller");
}
