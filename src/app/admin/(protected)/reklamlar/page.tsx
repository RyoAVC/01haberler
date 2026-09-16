import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { AdForm } from "@/components/admin/AdForm";
import { toggleAdActive, deleteAd } from "@/server/actions/adActions";

const PLACEMENT_LABEL: Record<string, string> = {
  HEADER_BELOW: "Header Altı",
  HOME_BELOW_HERO: "Manşet Altı",
  IN_FEED: "Liste İçi",
  ARTICLE_AFTER_LEAD: "Spottan Sonra",
  ARTICLE_MID_BODY: "İçerik Ortası",
  ARTICLE_END: "Haber Sonu",
  SIDEBAR: "Sidebar",
  FOOTER_ABOVE: "Footer Üstü",
  STICKY_BOTTOM: "Sticky",
};

export default async function AdminAdsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "ads:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const [ads, categories] = await Promise.all([
    prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-headline-l">Reklam Alanları</h1>
        <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
          AdSense/Ad Manager kimlikleri yalnızca burada, veritabanında saklanır — kaynak koduna gömülmez. Yeni eklenen reklam
          varsayılan olarak pasif gelir; test ettikten sonra &ldquo;Yayına Al&rdquo; ile etkinleştirin.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-headline-s">
          <thead>
            <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
              <th className="py-2 pr-4">Ad</th>
              <th className="py-2 pr-4">Yerleşim</th>
              <th className="py-2 pr-4">Sağlayıcı</th>
              <th className="py-2 pr-4">Gösterim</th>
              <th className="py-2 pr-4">Tıklama</th>
              <th className="py-2 pr-4">Durum</th>
              <th className="py-2 pr-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="border-b border-line dark:border-line-dark">
                <td className="py-2 pr-4">{ad.name}</td>
                <td className="py-2 pr-4">{PLACEMENT_LABEL[ad.placement]}</td>
                <td className="py-2 pr-4">{ad.provider}</td>
                <td className="py-2 pr-4">{ad.impressionCount}</td>
                <td className="py-2 pr-4">{ad.clickCount}</td>
                <td className="py-2 pr-4">{ad.isActive ? "Yayında" : "Pasif"}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-3">
                    <form action={toggleAdActive.bind(null, ad.id, !ad.isActive)}>
                      <button type="submit" className="text-brand-red hover:underline">
                        {ad.isActive ? "Yayından Kaldır" : "Yayına Al"}
                      </button>
                    </form>
                    <form action={deleteAd.bind(null, ad.id)}>
                      <button type="submit" className="hover:underline">Sil</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {ads.length === 0 && (
              <tr><td colSpan={7} className="py-3 text-ink-secondary dark:text-ink-dark-secondary">Henüz reklam alanı tanımlanmadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Reklam Alanı</h2>
        <div className="mt-3">
          <AdForm categories={categories} />
        </div>
      </section>
    </div>
  );
}
