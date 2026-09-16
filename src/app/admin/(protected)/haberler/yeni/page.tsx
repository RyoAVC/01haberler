import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { isAiEditorEnabled } from "@/server/services/aiEditorService";

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  const [categories, tags, authors] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-headline-l">Yeni Haber</h1>
      <ArticleForm
        userId={user!.id}
        categories={categories}
        tags={tags}
        authors={authors}
        canPublish={hasPermission(user!.role, "article:publish")}
        aiEditorEnabled={isAiEditorEnabled()}
      />
    </div>
  );
}
