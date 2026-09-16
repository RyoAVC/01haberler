import { prisma } from "@/lib/db";

export interface SeoIssue {
  label: string;
  count: number;
}

export interface SeoScoreResult {
  score: number;
  sampleSize: number;
  issues: SeoIssue[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const SAMPLE_SIZE = 30;
const MIN_WORD_COUNT = 150;

export async function getSeoScore(): Promise<SeoScoreResult> {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: SAMPLE_SIZE,
    select: {
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      coverMedia: { select: { altText: true } },
      coverImageAlt: true,
    },
  });

  if (articles.length === 0) {
    return { score: 100, sampleSize: 0, issues: [] };
  }

  let titleIssues = 0;
  let descriptionIssues = 0;
  let contentIssues = 0;
  let altIssues = 0;
  let totalChecks = 0;
  let passedChecks = 0;

  for (const article of articles) {
    const titleLen = article.metaTitle?.length ?? 0;
    totalChecks += 1;
    if (titleLen < 30 || titleLen > 65) titleIssues += 1;
    else passedChecks += 1;

    const descLen = article.metaDescription?.length ?? 0;
    totalChecks += 1;
    if (descLen < 120 || descLen > 160) descriptionIssues += 1;
    else passedChecks += 1;

    const wordCount = stripHtml(article.contentHtml).split(" ").filter(Boolean).length;
    totalChecks += 1;
    if (wordCount < MIN_WORD_COUNT) contentIssues += 1;
    else passedChecks += 1;

    totalChecks += 1;
    if (!article.coverImageAlt && !article.coverMedia?.altText) altIssues += 1;
    else passedChecks += 1;
  }

  const score = Math.round((passedChecks / totalChecks) * 100);

  const issues: SeoIssue[] = [
    { label: "Meta başlık 30-65 karakter dışında", count: titleIssues },
    { label: "Meta açıklama 120-160 karakter dışında", count: descriptionIssues },
    { label: `İçerik uzunluğu düşük (< ${MIN_WORD_COUNT} kelime)`, count: contentIssues },
    { label: "Kapak görseli alt metni eksik", count: altIssues },
  ].filter((issue) => issue.count > 0);

  return { score, sampleSize: articles.length, issues };
}
