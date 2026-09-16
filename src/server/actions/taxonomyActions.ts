"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { categoryInputSchema, tagInputSchema } from "@/lib/validation/taxonomy";

async function requireCategoryManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "category:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function createCategory(formData: FormData): Promise<void> {
  const user = await requireCategoryManager();

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: (formData.get("description") as string) || null,
    parentId: (formData.get("parentId") as string) || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: true,
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
  };

  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  await prisma.category.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "CATEGORY_CREATE", entityType: "Category" },
  });

  revalidatePath("/admin/kategoriler");
  revalidatePath("/");
}

export async function toggleCategoryActive(categoryId: string, isActive: boolean): Promise<void> {
  await requireCategoryManager();
  await prisma.category.update({ where: { id: categoryId }, data: { isActive } });
  revalidatePath("/admin/kategoriler");
  revalidatePath("/");
}

export async function createTag(formData: FormData): Promise<void> {
  const user = await requireCategoryManager();

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  };

  const parsed = tagInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  await prisma.tag.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "TAG_CREATE", entityType: "Tag" },
  });

  revalidatePath("/admin/etiketler");
}

export async function deleteTag(tagId: string): Promise<void> {
  const user = await requireCategoryManager();
  await prisma.tag.delete({ where: { id: tagId } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "TAG_DELETE", entityType: "Tag", entityId: tagId },
  });
  revalidatePath("/admin/etiketler");
}
