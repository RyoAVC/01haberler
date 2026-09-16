import type { Prisma, UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/auth/rbac";
export function mediaLibraryWhere(user: { id: string; role: UserRole }, query: string): Prisma.MediaWhereInput {
  const q = query.trim().slice(0, 100);
  return {
    ...(!hasPermission(user.role, "article:edit:any") ? { uploadedById: user.id } : {}),
    ...(q ? { OR: [{ originalFilename: { contains: q, mode: "insensitive" } }, { altText: { contains: q, mode: "insensitive" } }, { articlesCover: { some: { title: { contains: q, mode: "insensitive" } } } }] } : {}),
  };
}
