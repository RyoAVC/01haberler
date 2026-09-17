import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { mediaLibraryWhere } from "@/server/services/mediaLibraryService";
import { saveMediaMetadata } from "@/server/actions/mediaActions";
import { formatDateTr } from "@/lib/utils/formatDate";
export default async function MediaLibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; kaydedildi?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:create")) return <p>Bu bölüme erişim yetkiniz yok.</p>;
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.floor(Math.max(1, Math.min(10000, Number(params.page) || 1)));
  const where = mediaLibraryWhere(user, q);
  const [media, count] = await Promise.all([
    prisma.media.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 24, take: 24, include: { _count: { select: { articlesCover: true, advertisements: true } } } }),
    prisma.media.count({ where }),
  ]);
  const metadata = await prisma.siteSetting.findMany({ where: { key: { in: media.map(m => `media_metadata_${m.id}`) } }, select: { key: true, value: true } });
  const pageUrl = (value: number) => `/admin/medya?${new URLSearchParams({ q, page: String(value) })}`;
  return <div className="max-w-6xl"><h1 className="font-serif text-headline-l">Medya Merkezi</h1><p className="mt-2 text-caption text-ink-dark-secondary">Mevcut görselleri bulun, alternatif metinlerini ve kullanım notlarını yönetin. Yeni haber ekranından kütüphanedeki görselleri kapak olarak seçebilirsiniz.</p>
    {params.kaydedildi && <p role="status" className="mt-4 rounded border border-line-dark p-3">Görsel bilgileri kaydedildi.</p>}
    <form className="my-6 flex flex-wrap gap-3"><label className="min-w-0 flex-1 text-caption">Görsel ara<input name="q" defaultValue={q} maxLength={100} placeholder="Dosya, alt metin veya haber başlığı" className="mt-2 block w-full rounded border border-line-dark bg-transparent p-3" /></label><button className="self-end rounded bg-brand-red px-5 py-3 text-white">Ara</button></form>
    <p className="mb-4 text-caption">{count} görsel · Sayfa {page}</p>
    {!media.length && <p className="rounded border border-line-dark p-6">Bu arama için görsel bulunamadı. Aramayı temizleyin veya haber editöründen yeni görsel yükleyin.</p>}
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{media.map(item => {
      const info = metadata.find(m => m.key === `media_metadata_${item.id}`)?.value as { credit?: string; rights?: string; focusX?: number; focusY?: number } | undefined;
      return <article key={item.id} className="min-w-0 overflow-hidden rounded-xl border border-line-dark"><Image src={item.url} alt={item.altText ?? ""} width={400} height={220} unoptimized className="h-44 w-full bg-surface-dark-raised object-contain" /><div className="p-4"><h2 className="break-words text-headline-s">{item.originalFilename || item.altText || "Kaynak görseli"}</h2><p className="mt-2 text-caption text-ink-dark-secondary">{item.mimeType} · {item.sizeBytes > 0 ? `${(item.sizeBytes / 1024).toFixed(1)} KB` : "Boyut bilgisi yok"}{item.width && item.height ? ` · ${item.width}×${item.height}` : ""}<br />{formatDateTr(item.createdAt)} · {item.source === "UPLOAD" ? "Yüklenen dosya" : "Harici kaynak"}<br />{item._count.articlesCover} haber kapağı · {item._count.advertisements} reklam</p>
        <details className="mt-4"><summary className="cursor-pointer text-caption underline">Bilgileri düzenle</summary><form action={saveMediaMetadata.bind(null, item.id)} className="mt-3 space-y-3">
          <label className="block text-caption">Alternatif metin<input name="altText" defaultValue={item.altText ?? ""} maxLength={200} className="mt-1 block w-full border border-line-dark bg-transparent p-2" /></label>
          <label className="block text-caption">Fotoğrafçı / kaynak<input name="credit" defaultValue={info?.credit ?? ""} maxLength={300} className="mt-1 block w-full border border-line-dark bg-transparent p-2" /></label>
          <div className="grid grid-cols-2 gap-3">{(["X", "Y"] as const).map(axis => <label key={axis} className="text-caption">Odak {axis} (0–100)<input type="number" name={`focus${axis}`} min={0} max={100} defaultValue={info?.[axis === "X" ? "focusX" : "focusY"] ?? 50} className="mt-1 w-full border border-line-dark bg-transparent p-2" /></label>)}</div><p className="text-caption">50 merkezdir. Odak, ana sayfa manşetindeki kırpmayı yönlendirir.</p>
          <label className="block text-caption">Kullanım hakkı ve izin notu<textarea name="rights" defaultValue={info?.rights ?? ""} maxLength={1000} rows={3} className="mt-1 block w-full border border-line-dark bg-transparent p-2" /></label>
          <p className="text-caption text-ink-dark-secondary">Kaynak ve izin notları editör içindir; izin verildiği anlamına gelmez. Haberde ayrıca yazılan alt metin korunur.</p><button className="rounded bg-brand-red px-4 py-2 text-caption text-white">Bilgileri kaydet</button>
        </form></details></div></article>;
    })}</div>
    <nav aria-label="Medya sayfaları" className="mt-6 flex justify-between text-caption">{page > 1 ? <Link href={pageUrl(page - 1)}>← Önceki</Link> : <span />}{page * 24 < count && <Link href={pageUrl(page + 1)}>Sonraki →</Link>}</nav>
  </div>;
}
