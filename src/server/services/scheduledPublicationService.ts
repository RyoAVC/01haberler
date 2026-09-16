import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
export async function publishDueArticles(now = new Date()): Promise<number> {
  const due = await prisma.article.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: now } }, select: { id: true, scheduledAt: true }, take: 100 });
  let published = 0;
  for (const article of due) {
    published += await prisma.$transaction(async tx => {
      const result = await tx.article.updateMany({ where: { id: article.id, status: "SCHEDULED", scheduledAt: article.scheduledAt }, data: { status: "PUBLISHED", publishedAt: article.scheduledAt, scheduledAt: null } });
      if (result.count) await tx.auditLog.create({ data: { action: "ARTICLE_SCHEDULE_PUBLISH", entityType: "Article", entityId: article.id, metadata: { scheduledAt: article.scheduledAt!.toISOString(), processedAt: now.toISOString() } } });
      return result.count;
    });
  }
  if (published) { revalidatePath("/", "layout"); revalidatePath("/admin/haberler"); }
  return published;
}
