import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  getArticleBySlug,
  getRelatedArticles,
  getPrevNextArticle,
} from "@/server/services/articleService";
import { formatDateTr } from "@/lib/utils/formatDate";
import { newsArticleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { ShareButtons } from "@/components/article/ShareButtons";
import { ArticleViewTracker } from "@/components/article/ArticleViewTracker";
import { ArticleCard } from "@/components/article/ArticleCard";
import { CommentForm } from "@/components/article/CommentForm";
import { CommentList } from "@/components/article/CommentList";
import { AdSlot } from "@/components/ads/AdSlot";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const canonical = article.canonicalUrl || `/haber/${article.slug}`;
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      images: article.coverMedia ? [article.coverMedia.url] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.coverMedia ? [article.coverMedia.url] : undefined,
    },
  };
}

function splitForMidAd(html: string): [string, string] {
  const paragraphs = html.split("</p>");
  const mid = Math.floor(paragraphs.length / 2);
  if (paragraphs.length < 4) return [html, ""];
  return [paragraphs.slice(0, mid).join("</p>") + "</p>", paragraphs.slice(mid).join("</p>")];
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [related, prevNext, commentsEnabled] = await Promise.all([
    getRelatedArticles(article.id, article.category.id),
    article.publishedAt
      ? getPrevNextArticle(article.category.id, article.publishedAt)
      : Promise.resolve({ prev: null, next: null }),
    isModuleEnabled("comments"),
  ]);

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const canonicalUrl = article.canonicalUrl || `${appUrl}/haber/${article.slug}`;
  const [firstHalf, secondHalf] = splitForMidAd(article.contentHtml);

  return (
    <div className="container-page py-6">
      <ArticleViewTracker articleId={article.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd(article, canonicalUrl)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana Sayfa", url: appUrl },
              { name: article.category.name, url: `${appUrl}/kategori/${article.category.slug}` },
              { name: article.title, url: canonicalUrl },
            ])
          ),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 text-meta text-ink-secondary dark:text-ink-dark-secondary">
        <Link href="/" className="hover:underline">Ana Sayfa</Link>
        {" / "}
        <Link href={`/kategori/${article.category.slug}`} className="hover:underline">
          {article.category.name}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          <p className="kicker">{article.category.name}</p>
          <h1 className="mt-2 font-serif text-display-sm leading-tight sm:text-display">{article.title}</h1>
          <p className="mt-3 max-w-measure text-body text-ink-secondary dark:text-ink-dark-secondary">
            {article.excerpt}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-ink-secondary dark:text-ink-dark-secondary">
            {article.author && <span>Yazar: {article.author.name}</span>}
            {!article.author && article.sourceDisplayName && <span>Kaynak: {article.sourceDisplayName}</span>}
            <span>Yayın: {article.publishedAt && formatDateTr(article.publishedAt)}</span>
            <span>Güncelleme: {formatDateTr(article.updatedAt)}</span>
            <span>{article.readingTimeMinutes} dk okuma</span>
          </div>

          {article.coverMedia && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden bg-line dark:bg-line-dark">
              <Image
                src={article.coverMedia.url}
                alt={article.coverMedia.altText || article.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
          )}

          <div className="mt-6 rule-top rule-bottom py-3">
            <ShareButtons url={canonicalUrl} title={article.title} />
          </div>

          <AdSlot placement="ARTICLE_AFTER_LEAD" categorySlug={article.category.slug} eager />

          <div
            className="prose prose-neutral mt-6 max-w-measure text-body dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: firstHalf }}
          />

          {secondHalf && (
            <>
              <AdSlot placement="ARTICLE_MID_BODY" categorySlug={article.category.slug} />
              <div
                className="prose prose-neutral max-w-measure text-body dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: secondHalf }}
              />
            </>
          )}

          {article.tags.length > 0 && (
            <p className="mt-6 text-headline-s text-ink-secondary print:hidden dark:text-ink-dark-secondary">
              Etiketler:{" "}
              {article.tags.map(({ tag }, i) => (
                <span key={tag.slug}>
                  <Link href={`/etiket/${tag.slug}`} className="text-ink hover:text-brand-red dark:text-ink-dark">
                    {tag.name}
                  </Link>
                  {i < article.tags.length - 1 && ", "}
                </span>
              ))}
            </p>
          )}

          {article.sourceUrl && (
            <p className="mt-6 rule-top pt-4 text-meta text-ink-secondary dark:text-ink-dark-secondary">
              Kaynak: {article.sourceDisplayName ?? "Bilinmeyen kaynak"} —{" "}
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-red hover:underline">
                Orijinal haberi görüntüle
              </a>
            </p>
          )}

          <AdSlot placement="ARTICLE_END" categorySlug={article.category.slug} />

          <nav className="mt-8 grid grid-cols-1 gap-3 rule-top pt-4 text-headline-s sm:grid-cols-2 print:hidden">
            {prevNext.prev && (
              <Link href={`/haber/${prevNext.prev.slug}`} className="hover:text-brand-red">
                ← Önceki: {prevNext.prev.title}
              </Link>
            )}
            {prevNext.next && (
              <Link href={`/haber/${prevNext.next.slug}`} className="text-right hover:text-brand-red sm:col-start-2">
                Sonraki: {prevNext.next.title} →
              </Link>
            )}
          </nav>

          {related.length > 0 && (
            <section className="mt-10 print:hidden">
              <h2 className="mb-4 rule-bottom pb-2 font-serif text-headline-l">Benzer Haberler</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
          {commentsEnabled && (
            <section className="mt-10 rule-top pt-6 print:hidden">
              <h2 className="mb-4 font-serif text-headline-l">Yorumlar</h2>
              <CommentList articleId={article.id} />
              <div className="mt-6">
                <CommentForm articleId={article.id} articleSlug={article.slug} />
              </div>
            </section>
          )}
        </article>

        <aside className="print:hidden">
          <AdSlot placement="SIDEBAR" categorySlug={article.category.slug} eager />
        </aside>
      </div>
    </div>
  );
}
