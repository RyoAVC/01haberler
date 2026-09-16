import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { isAiEditorEnabled } from "@/server/services/aiEditorService";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kaydedildi?: string }>;
}

export default async function EditArticlePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { kaydedildi } = await searchParams;
  const user = await getCurrentUser();

  const [article, categories, tags, authors] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: { tags: { select: { tagId: true } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-2 font-serif text-headline-l">Haberi Düzenle</h1>
      {kaydedildi && <p className="mb-4 border border-line px-3 py-2 text-headline-s dark:border-line-dark">Kaydedildi.</p>}
      <ArticleForm
        categories={categories}
        tags={tags}
        authors={authors}
        canPublish={hasPermission(user!.role, "article:publish")}
        aiEditorEnabled={isAiEditorEnabled()}
        article={{
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          contentHtml: article.contentHtml,
          categoryId: article.categoryId,
          authorId: article.authorId,
          coverMediaId: article.coverMediaId,
          coverImageAlt: article.coverImageAlt,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          canonicalUrl: article.canonicalUrl,
          status: article.status,
          isBreaking: article.isBreaking,
          isFeatured: article.isFeatured,
          isEditorsPick: article.isEditorsPick,
          tagIds: article.tags.map((t) => t.tagId),
        }}
      />
    </div>
  );
}
