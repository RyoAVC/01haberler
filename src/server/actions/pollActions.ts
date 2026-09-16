"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { hashIp } from "@/lib/utils/hash";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { castVote } from "@/server/services/pollService";
import { slugify } from "@/lib/utils/slug";

async function requirePollManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "polls:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function savePoll(formData: FormData): Promise<void> {
  const user = await requirePollManager();

  const question = String(formData.get("question") ?? "").trim();
  const options = formData
    .getAll("options")
    .map((o) => String(o).trim())
    .filter(Boolean);

  if (!question || options.length < 2) {
    throw new Error("Soru ve en az 2 seçenek gerekli");
  }

  await prisma.poll.create({
    data: {
      question,
      slug: `${slugify(question)}-${Date.now()}`,
      createdById: user.id,
      options: { create: options.map((label, sortOrder) => ({ label, sortOrder })) },
    },
  });

  revalidatePath("/admin/anketler");
}

export async function deletePollAction(id: string): Promise<void> {
  await requirePollManager();
  await prisma.poll.delete({ where: { id } });
  revalidatePath("/admin/anketler");
}

export async function togglePollActiveAction(id: string, isActive: boolean): Promise<void> {
  await requirePollManager();
  await prisma.poll.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/anketler");
}

export async function submitPollVoteAction(pollId: string, optionId: string): Promise<{ error?: string }> {
  if (!(await isModuleEnabled("polls"))) {
    return { error: "Anketler şu an kapalı" };
  }
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const result = await castVote(pollId, optionId, hashIp(ip));
  revalidatePath("/");
  return result;
}
