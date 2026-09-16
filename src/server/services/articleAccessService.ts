import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth/rbac";
import type { UserRole } from "@prisma/client";
export async function canEditArticle(user: { id: string; role: UserRole }, articleId: string) {
  if (hasPermission(user.role, "article:edit:any")) return true;
  if (!hasPermission(user.role, "article:edit:own")) return false;
  const [authored, created] = await Promise.all([
    prisma.article.count({ where: { id: articleId, author: { userId: user.id } } }),
    prisma.auditLog.count({ where: { entityId: articleId, entityType: "Article", action: "ARTICLE_CREATE", userId: user.id } }),
  ]);
  return authored > 0 || created > 0;
}
