"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { hashIp } from "@/lib/utils/hash";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { submitComment } from "@/server/services/commentService";
import type { CommentStatus } from "@prisma/client";

export interface SubmitCommentFormState {
  error?: string;
  success?: boolean;
}

export async function submitCommentAction(
  articleId: string,
  articleSlug: string,
  formData: FormData
): Promise<SubmitCommentFormState> {
  if (!(await isModuleEnabled("comments"))) {
    return { error: "Yorumlar şu an kapalı" };
  }

  const authorName = String(formData.get("authorName") ?? "").trim();
  const authorEmail = String(formData.get("authorEmail") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!authorName || !authorEmail || !body) {
    return { error: "Ad, e-posta ve yorum metni gerekli" };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  await submitComment({ articleId, authorName, authorEmail, body, ipHash: hashIp(ip) });

  revalidatePath(`/haber/${articleSlug}`);
  return { success: true };
}

async function requireCommentModerator() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "comments:moderate")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function moderateComment(id: string, status: CommentStatus): Promise<void> {
  const user = await requireCommentModerator();
  await prisma.comment.update({ where: { id }, data: { status, moderatedById: user.id, moderatedAt: new Date() } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: `COMMENT_${status}`, entityType: "Comment", entityId: id },
  });
  revalidatePath("/admin/yorumlar");
}

export async function deleteCommentAction(id: string): Promise<void> {
  const user = await requireCommentModerator();
  await prisma.comment.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "COMMENT_DELETE", entityType: "Comment", entityId: id },
  });
  revalidatePath("/admin/yorumlar");
}
