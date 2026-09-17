"use server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { submissionSchema } from "@/lib/validation/newsroom";
import { rateLimit } from "@/lib/security/rateLimit";
import { hashIp } from "@/lib/utils/hash";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { saveNewsroomRecord } from "@/server/services/newsroomStore";
import { revalidatePath } from "next/cache";
import type { FormResult } from "@/components/admin/ActionForm";
export async function submitReaderReport(_: FormResult, form: FormData): Promise<FormResult> {
  if (form.get("website")) return { error: "Başvuru doğrulanamadı." };
  const parsed = submissionSchema.safeParse({ ...Object.fromEntries(form), consent: form.get("consent") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." };
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    const limit = await rateLimit(`reader-report:${hashIp(ip)}`, 3, 3600);
    if (!limit.allowed) return { error: "Başvuru sınırına ulaştınız. Bir saat sonra tekrar deneyin." };
    const reference = randomUUID();
    await prisma.siteSetting.create({ data: { key: `newsroom.report.${reference}`, value: { ...parsed.data, reference, status: "NEW", note: "", createdAt: new Date().toISOString() } } });
    revalidatePath("/admin/basvurular");
    return { success: `Başvurunuz editör kuyruğuna alındı. Başvuru numarası: ${reference}. Bu işlem haberin yayımlandığı veya düzeltildiği anlamına gelmez.` };
  } catch { return { error: "Başvuru şu anda kaydedilemiyor. Lütfen daha sonra tekrar deneyin." }; }
}
export async function moderateReaderReport(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "comments:moderate")) return { error: "Yetkiniz yok." };
  const key = String(form.get("key"));
  if (!/^newsroom\.report\.[a-f0-9-]{36}$/.test(key)) return { error: "Geçersiz başvuru." };
  const status = String(form.get("status"));
  if (!["NEW", "REVIEWING", "RESOLVED", "REJECTED"].includes(status)) return { error: "Geçersiz durum." };
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const data = submissionSchema.safeParse(row?.value);
  if (!row || !data.success) return { error: "Başvuru bulunamadı." };
  const original = row.value as Record<string, string | boolean>;
  try { await saveNewsroomRecord(key, { ...original, status, note: String(form.get("note") ?? "").slice(0, 2000) }, user.id, String(form.get("expected"))); }
  catch { return { error: "Kayıt değişmiş olabilir. Sayfayı yenileyin." }; }
  revalidatePath("/admin/basvurular"); return { success: "Başvurunun durumu güncellendi." };
}
