import Link from "next/link";
import { HeadlinePlanner } from "@/components/admin/HeadlinePlanner";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { getHomeSettings } from "@/server/services/homeSettingsService";
import { saveHomeSettings } from "@/server/actions/homeSettingsActions";
export default async function VitrinePage({ searchParams }: { searchParams: Promise<{ kaydedildi?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) return <p>Bu bölüme erişim yetkiniz yok.</p>;
  const [settings, articles, params] = await Promise.all([getHomeSettings(), prisma.article.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, coverMedia: { select: { url: true } } }, take: 200 }), searchParams]);
  return <div className="max-w-3xl"><h1 className="font-serif text-headline-l">Ana Sayfa Vitrini</h1><p className="mt-2 text-caption text-ink-dark-secondary">Manşet sırasını ve özel kampanya alanlarını yönetin. Boş seçimlerde öne çıkan ve son haberler otomatik tamamlanır.</p>
    {params.kaydedildi && <p role="status" className="my-4 border border-line-dark p-3">Vitrin kaydedildi.</p>}
    <form action={saveHomeSettings} className="mt-6 space-y-5">
      <HeadlinePlanner settings={settings} articles={articles} />
      <label className="flex gap-3 text-caption"><input name="campaignsEnabled" type="checkbox" defaultChecked={settings.campaignsEnabled} />Avcı E-Ticaret ve Adana360 özel bannerlarını göster</label>
      <p className="text-caption text-ink-dark-secondary">Geniş ekranlarda iki kenar, diğer ekranlarda manşet altında yatay alan kullanılır. Aynı haber tek kez gösterilir; yayından kaldırılan haber manşette tutulmaz.</p>
      <button className="rounded-full bg-brand-red px-6 py-3 text-white">Vitrini kaydet</button><Link href="/" target="_blank" className="ml-4 text-caption underline">Ana sayfayı aç ↗</Link>
    </form></div>;
}
