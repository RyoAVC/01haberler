import { prisma } from "@/lib/db";
import { findBannedWordMatches } from "@/server/services/bannedWordService";
import type { CommentStatus } from "@prisma/client";

export interface SubmitCommentInput {
  articleId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  ipHash?: string;
}

export async function submitComment(input: SubmitCommentInput) {
  const { blocking } = await findBannedWordMatches(input.body);
  const status: CommentStatus = blocking.length > 0 ? "REJECTED" : "PENDING";

  return prisma.comment.create({
    data: {
      articleId: input.articleId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      body: input.body,
      ipHash: input.ipHash,
      status,
    },
  });
}

export async function getApprovedCommentsForArticle(articleId: string) {
  return prisma.comment.findMany({
    where: { articleId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  });
}

export async function listCommentsForModeration({ status }: { status?: CommentStatus } = {}) {
  return prisma.comment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { article: { select: { title: true, slug: true } } },
  });
}
