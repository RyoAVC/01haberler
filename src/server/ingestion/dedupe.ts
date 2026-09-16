import { prisma } from "@/lib/db";
import { canonicalizeUrl, contentHash } from "@/lib/utils/hash";

export interface DedupeCheckInput {
  link: string;
  title: string;
  excerpt: string;
}

export interface DedupeCheckResult {
  isDuplicate: boolean;
  canonicalUrl: string;
  contentHash: string;
}

export async function checkDuplicate(input: DedupeCheckInput): Promise<DedupeCheckResult> {
  const canonicalUrl = canonicalizeUrl(input.link);
  const hash = contentHash(input.title, input.excerpt);

  const existing = await prisma.article.findFirst({
    where: {
      OR: [{ sourceUrl: canonicalUrl }, { contentHash: hash }],
    },
    select: { id: true },
  });

  return { isDuplicate: Boolean(existing), canonicalUrl, contentHash: hash };
}
