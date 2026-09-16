import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";
export default async function OperationsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "source:manage")) return <p>Bu bölüme erişim yetkiniz yok.</p>;
  const [feeds, jobs] = await Promise.all([
    prisma.feed.findMany({ include: { source: { select: { name: true } } }, orderBy: { consecutiveFailures: "desc" } }),
    prisma.ingestionJob.findMany({ take: 30, orderBy: { createdAt: "desc" }, include: { feed: { include: { source: { select: { name: true } } } } } }),
  ]);
  const active = feeds.filter(f => f.isActive);
  const failing = active.filter(f => f.consecutiveFailures > 0);
  return <div><h1 className="font-serif text-headline-l">Operasyon Merkezi</h1><p className="mt-2 text-caption text-ink-dark-secondary">Kaynak sağlığı ve son 30 haber alma işi. Bu ekran görev çalıştırmaz; yenilendiğinde güncel kayıtları okur.</p>
    <div className="my-6 grid gap-4 sm:grid-cols-3">{[["Aktif akış", active.length], ["Hatalı akış", failing.length], ["Çalışan son işler", jobs.filter(j => j.status === "RUNNING").length]].map(([label, value]) => <div key={label} className="rounded-xl border border-line-dark p-5"><p className="text-caption">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></div>)}</div>
    <h2 className="font-serif text-headline-m">Kaynak sağlığı</h2><div className="my-4 grid gap-3 lg:grid-cols-2">{feeds.map(feed => <div key={feed.id} className="rounded-xl border border-line-dark p-4"><div className="flex justify-between gap-3"><strong>{feed.source.name}</strong><span className="text-caption">{!feed.isActive ? "Pasif" : feed.lastStatus === "OK" ? "Sağlıklı" : "Kontrol gerekli"}</span></div><p className="mt-2 break-all text-caption text-ink-dark-secondary">{feed.url}</p><p className="mt-3 text-caption">Son başarı: {feed.lastSuccessAt ? formatDateTr(feed.lastSuccessAt) : "Henüz yok"} · Ardışık hata: {feed.consecutiveFailures}</p><Link href="/admin/kaynaklar" className="mt-2 inline-block text-caption text-brand-red">Kaynak ayarları →</Link></div>)}</div>
    <h2 className="mt-8 font-serif text-headline-m">Son işler</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-caption"><thead><tr>{["Kaynak / zaman", "Durum", "Bulunan", "Eklenen", "Tekrar"].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{jobs.map(job => <tr key={job.id} className="border-t border-line-dark"><td className="p-3">{job.feed.source.name}<time className="block text-ink-dark-secondary">{formatDateTr(job.createdAt)}</time></td><td className="p-3">{{ PENDING: "Bekliyor", RUNNING: "Çalışıyor", SUCCESS: "Başarılı", FAILED: "Başarısız" }[job.status] ?? job.status}</td><td className="p-3">{job.itemsFound}</td><td className="p-3">{job.itemsCreated}</td><td className="p-3">{job.itemsSkippedDuplicate}</td></tr>)}</tbody></table>{!jobs.length && <p className="p-4">Henüz görev kaydı yok.</p>}</div>
  </div>;
}
