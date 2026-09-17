import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { isAiEditorEnabled } from "@/server/services/aiEditorService";
import { formatPublicationSchedule } from "@/lib/utils/publicationSchedule";
import { formatDateTr } from "@/lib/utils/formatDate";
import { qualityText } from "@/lib/utils/articleQuality";
import { canEditArticle } from "@/server/services/articleAccessService";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kaydedildi?: string }>;
}

export default async function EditArticlePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { kaydedildi } = await searchParams;
  const user = await getCurrentUser();
  if (!user || !await canEditArticle(user, id)) notFound();

  const [article, categories, tags, authors] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: { tags: { select: { tagId: true } }, coverMedia: { select: { url: true } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!article) notFound();
  const revisions = await prisma.articleRevision.findMany({ where: { articleId: id }, orderBy: { createdAt: "desc" }, take: 10, include: { editedBy: { select: { name: true } } } });

  return (
    <div>
      <h1 className="mb-2 font-serif text-headline-l">Haberi Düzenle</h1>
      {kaydedildi && <p className="mb-4 border border-line px-3 py-2 text-headline-s dark:border-line-dark">Kaydedildi.</p>}
      <ArticleForm
        userId={user.id}
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
          coverMediaUrl: article.coverMedia?.url,
          coverImageAlt: article.coverImageAlt,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          canonicalUrl: article.canonicalUrl,
          city: article.city,
          district: article.district,
          status: article.status,
          scheduledAt: formatPublicationSchedule(article.scheduledAt),
          sourceUrl: article.sourceUrl,
          sourceRequired: !!article.sourceId,
          sourcePublishedAt: article.publishedAt?.toISOString() ?? null,
          updatedAt: article.updatedAt.toISOString(),
          isBreaking: article.isBreaking,
          isFeatured: article.isFeatured,
          isEditorsPick: article.isEditorsPick,
          tagIds: article.tags.map((t) => t.tagId),
        }}
      />
      <section className="mt-10 max-w-3xl border-t border-line-dark pt-6" aria-label="Haber geçmişi"><h2 className="font-serif text-headline-m">Düzenleme geçmişi</h2><p className="mt-2 text-caption text-ink-dark-secondary">Son 10 kayıt salt okunur gösterilir. Karşılaştırma için bir kaydı açın; eski metin otomatik yayımlanmaz.</p>
        {!revisions.length && <p className="mt-4 text-caption">Henüz düzenleme kaydı yok.</p>}
        {revisions.map(revision => <details key={revision.id} className="mt-3 rounded border border-line-dark p-4"><summary className="cursor-pointer text-caption">{formatDateTr(revision.createdAt)} · {revision.editedBy?.name ?? "Sistem"}</summary><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><h3 className="text-caption text-ink-dark-secondary">Kayıtlı sürüm</h3><strong className="mt-2 block">{revision.title}</strong><p className="mt-2 text-caption">{revision.excerpt}</p><p className="mt-3 whitespace-pre-wrap text-caption">{qualityText(revision.contentHtml)}</p></div><div><h3 className="text-caption text-ink-dark-secondary">Güncel sürüm</h3><strong className="mt-2 block">{article.title}</strong><p className="mt-2 text-caption">{article.excerpt}</p><p className="mt-3 whitespace-pre-wrap text-caption">{qualityText(article.contentHtml)}</p></div></div></details>)}
      </section>
    </div>
  );
}
