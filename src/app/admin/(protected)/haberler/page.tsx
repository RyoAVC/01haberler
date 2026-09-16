import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTr } from "@/lib/utils/formatDate";
import { approveArticle, rejectArticle, archiveArticle, bulkApproveArticles } from "@/server/actions/articleActions";
import type { ArticleStatus } from "@prisma/client";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  FETCHED: "Çekildi",
  PENDING_REVIEW: "İncelemede",
  DRAFT: "Taslak",
  SCHEDULED: "Zamanlanmış",
  PUBLISHED: "Yayında",
  REJECTED: "Reddedildi",
  ARCHIVED: "Arşivlendi",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as ArticleStatus[];

interface Props {
  searchParams: Promise<{ durum?: string; sayfa?: string }>;
}

export default async function AdminArticlesPage({ searchParams }: Props) {
  const { durum, sayfa } = await searchParams;
  const status = STATUS_OPTIONS.includes(durum as ArticleStatus) ? (durum as ArticleStatus) : undefined;
  const page = Math.max(1, Number(sayfa) || 1);
  const pageSize = 20;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        category: { select: { name: true } },
        sourceDisplayName: true,
      },
    }),
    prisma.article.count({ where: status ? { status } : undefined }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-headline-l">Haberler</h1>
        <div className="flex items-center gap-3">
          <button type="submit" form="bulk-approve-form" className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
            Seçilenleri Onayla ve Yayınla
          </button>
          <Link href="/admin/haberler/toplu-ekle" className="border border-line px-4 py-2 text-headline-s hover:border-brand-red dark:border-line-dark">
            + Toplu Ekle
          </Link>
          <Link href="/admin/haberler/yeni" className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
            + Yeni Haber
          </Link>
        </div>
      </div>
      <form id="bulk-approve-form" action={bulkApproveArticles} />

      <div className="mt-4 flex flex-wrap gap-2 text-headline-s">
        <Link href="/admin/haberler" className={!status ? "text-brand-red underline" : "hover:text-brand-red"}>
          Tümü ({total})
        </Link>
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/admin/haberler?durum=${s}`}
            className={status === s ? "text-brand-red underline" : "hover:text-brand-red"}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-headline-s">
          <thead>
            <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
              <th className="py-2 pr-4"></th>
              <th className="py-2 pr-4">Başlık</th>
              <th className="py-2 pr-4">Kategori</th>
              <th className="py-2 pr-4">Durum</th>
              <th className="py-2 pr-4">Tarih</th>
              <th className="py-2 pr-4">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-line dark:border-line-dark">
                <td className="py-3 pr-4">
                  {(article.status === "PENDING_REVIEW" || article.status === "FETCHED") && (
                    <input type="checkbox" name="articleIds" value={article.id} form="bulk-approve-form" />
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/admin/haberler/${article.id}/duzenle`} className="hover:text-brand-red">
                    {article.title}
                  </Link>
                  {article.sourceDisplayName && (
                    <span className="ml-2 text-caption text-ink-secondary dark:text-ink-dark-secondary">
                      ({article.sourceDisplayName})
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">{article.category.name}</td>
                <td className="py-3 pr-4">{STATUS_LABEL[article.status]}</td>
                <td className="py-3 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">
                  {formatDateTr(article.publishedAt ?? article.createdAt)}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-3">
                    {(article.status === "PENDING_REVIEW" || article.status === "FETCHED") && (
                      <>
                        <form action={approveArticle.bind(null, article.id)}>
                          <button type="submit" className="text-brand-red hover:underline">
                            Onayla ve Yayınla
                          </button>
                        </form>
                        <form action={rejectArticle.bind(null, article.id)}>
                          <button type="submit" className="text-ink-secondary hover:underline dark:text-ink-dark-secondary">
                            Reddet
                          </button>
                        </form>
                      </>
                    )}
                    {article.status === "PUBLISHED" && (
                      <form action={archiveArticle.bind(null, article.id)}>
                        <button type="submit" className="text-ink-secondary hover:underline dark:text-ink-dark-secondary">
                          Arşivle
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-secondary dark:text-ink-dark-secondary">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
