import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { submissionSchema } from "@/lib/validation/newsroom";
import { ActionForm } from "@/components/admin/ActionForm";
import { moderateReaderReport } from "@/server/actions/readerSubmissionActions";
export default async function Reports({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const user = await getCurrentUser(); if (!user || !hasPermission(user.role, "comments:moderate")) return <p>Yetkiniz yok.</p>;
  const q = await searchParams, page = Math.max(1, Math.min(1000, Math.floor(Number(q.page) || 1)));
  const status = ["NEW", "REVIEWING", "RESOLVED", "REJECTED"].includes(q.status ?? "") ? q.status : "";
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: "newsroom.report." }, ...(status ? { value: { path: ["status"], equals: status } } : {}) }, orderBy: [{ updatedAt: "desc" }, { key: "asc" }], take: 25, skip: (page - 1) * 25 });
  return <div className="space-y-5"><h1 className="font-serif text-headline-l">İhbar ve düzeltme kuyruğu</h1><p>İletişim bilgileri yalnızca yetkili moderatörlere görünür. Başvuru içeriği otomatik yayımlanmaz.</p><form className="module-form"><label>Durum<select name="status" defaultValue={status}><option value="">Tümü</option>{["NEW", "REVIEWING", "RESOLVED", "REJECTED"].map(s => <option key={s}>{s}</option>)}</select></label><button className="module-button mt-3">Filtrele</button></form>
    {rows.map(row => { const p = submissionSchema.safeParse(row.value); if (!p.success) return null; const extra = row.value as Record<string, string>; return <article key={row.key} className="module-card"><p className="text-caption break-all">{extra.reference} · {p.data.kind === "TIP" ? "İhbar" : "Düzeltme"}</p><h2 className="my-3 font-serif text-headline-m">{p.data.title}</h2><p className="whitespace-pre-line">{p.data.message}</p><p className="my-3 text-caption">{p.data.name} · {p.data.email}</p>{p.data.articleUrl && <a href={p.data.articleUrl} target="_blank" rel="noopener noreferrer" className="underline">İlgili bağlantı ↗</a>}<ActionForm key={row.key} action={moderateReaderReport}><input type="hidden" name="key" value={row.key} /><input type="hidden" name="expected" value={row.updatedAt.toISOString()} /><label>Durum<select name="status" defaultValue={extra.status}>{[["NEW", "Yeni"], ["REVIEWING", "İnceleniyor"], ["RESOLVED", "Sonuçlandı"], ["REJECTED", "Reddedildi"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label><label>İç not<textarea name="note" defaultValue={extra.note} maxLength={2000} /></label><button className="module-button">Durumu kaydet</button></ActionForm></article>; })}
    {!rows.length && <p>Bu filtrede başvuru yok.</p>}<nav className="flex justify-between">{page > 1 ? <Link href={`?page=${page - 1}&status=${status}`}>← Önceki</Link> : <span />}{rows.length === 25 && <Link href={`?page=${page + 1}&status=${status}`}>Sonraki →</Link>}</nav></div>;
}
