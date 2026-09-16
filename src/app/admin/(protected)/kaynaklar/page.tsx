import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";
import {
  createSource,
  createFeed,
  toggleFeedActive,
  toggleSourceAutoPublish,
  runFeedNow,
  runAllActiveFeedsNow,
} from "@/server/actions/sourceActions";

export default async function AdminSourcesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "source:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const [sources, categories] = await Promise.all([
    prisma.source.findMany({
      orderBy: { createdAt: "desc" },
      include: { feeds: { include: { jobs: { orderBy: { createdAt: "desc" }, take: 1 } } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-headline-l">Kaynaklar ve RSS Akışları</h1>
          <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Otomatik çekilen haberler varsayılan olarak önce &ldquo;İncelemede&rdquo; durumuna düşer. &ldquo;Otomatik Yayına güvenilir&rdquo; işaretli
            bir kaynak için, /admin/moduller&apos;den &ldquo;AI Otomatik Düzenleme ve Yayın&rdquo; açıksa, haberler AI ile özgünleştirilip doğrudan yayınlanır.
          </p>
        </div>
        <form action={runAllActiveFeedsNow}>
          <button type="submit" className="whitespace-nowrap bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
            Tüm Aktif Kaynakları Çek
          </button>
        </form>
      </div>

      {sources.map((source) => (
        <section key={source.id} className="border border-line p-4 dark:border-line-dark">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-headline-m">{source.name}</h2>
            <div className="flex items-center gap-3 text-caption text-ink-secondary dark:text-ink-dark-secondary">
              <span>{source.isActive ? "Aktif" : "Pasif"}</span>
              <form action={toggleSourceAutoPublish.bind(null, source.id, !source.isTrustedForAutoPublish)}>
                <button type="submit" className={source.isTrustedForAutoPublish ? "text-brand-red hover:underline" : "hover:underline"}>
                  Otomatik Yayın: {source.isTrustedForAutoPublish ? "Açık" : "Kapalı"}
                </button>
              </form>
            </div>
          </div>
          <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">{source.licenseNote}</p>

          <table className="mt-4 w-full text-headline-s">
            <thead>
              <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
                <th className="py-2 pr-4">Feed URL</th>
                <th className="py-2 pr-4">Durum</th>
                <th className="py-2 pr-4">Son Çalışma</th>
                <th className="py-2 pr-4">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {source.feeds.map((feed) => (
                <tr key={feed.id} className="border-b border-line dark:border-line-dark">
                  <td className="max-w-xs truncate py-2 pr-4">{feed.url}</td>
                  <td className="py-2 pr-4">{feed.lastStatus === "OK" ? "Sağlıklı" : feed.lastStatus === "ERROR" ? "Hatalı" : "Hiç çalışmadı"}</td>
                  <td className="py-2 pr-4 text-caption">{feed.lastFetchedAt ? formatDateTr(feed.lastFetchedAt) : "—"}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <form action={runFeedNow} className="flex items-center gap-2">
                        <input type="hidden" name="feedId" value={feed.id} />
                        <select
                          name="categoryId"
                          defaultValue={feed.categoryId ?? ""}
                          className="border border-line bg-transparent px-2 py-1 text-caption dark:border-line-dark"
                        >
                          <option value="">Kaynak varsayılanı</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="submit" className="text-brand-red hover:underline">Çek</button>
                      </form>
                      <form action={toggleFeedActive.bind(null, feed.id, !feed.isActive)}>
                        <button type="submit" className="hover:underline">{feed.isActive ? "Devre Dışı Bırak" : "Etkinleştir"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {source.feeds.length === 0 && (
                <tr><td colSpan={4} className="py-3 text-ink-secondary dark:text-ink-dark-secondary">Henüz feed eklenmedi.</td></tr>
              )}
            </tbody>
          </table>

          <details className="mt-4">
            <summary className="cursor-pointer text-headline-s text-brand-red">+ Feed Ekle</summary>
            <form action={createFeed} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="sourceId" value={source.id} />
              <input name="url" placeholder="https://ornek-kaynak.com/rss.xml" required className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
              <select name="categoryId" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark">
                <option value="">Kategori (feed varsayılanı kullanılsın)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="fetchIntervalMinutes" type="number" min={5} defaultValue={15} className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
              <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Feed Ekle</button>
            </form>
          </details>
        </section>
      ))}

      <section className="border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Kaynak Ekle</h2>
        <form action={createSource} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Kaynak adı" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="slug" placeholder="kaynak-slug" required pattern="[a-z0-9-]+" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="homepageUrl" placeholder="https://ornek-kaynak.com" required className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
          <textarea
            name="licenseNote"
            placeholder="Lisans/kullanım şartı notu (zorunlu) — örn. 'Yalnızca RSS özet/kısa alıntı; tam metin yayınlanamaz, kaynak ve link her haberde gösterilir.'"
            required
            rows={2}
            className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark"
          />
          <select name="defaultCategoryId" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark">
            <option value="">Varsayılan kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="onDeleteAction" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark">
            <option value="KEEP_ARTICLES">Silinirse: haberleri koru</option>
            <option value="ARCHIVE_ARTICLES">Silinirse: haberleri arşivle</option>
            <option value="DELETE_ARTICLES">Silinirse: haberleri de sil</option>
          </select>
          <label className="flex items-center gap-2 text-headline-s sm:col-span-2">
            <input type="checkbox" name="isTrustedForAutoPublish" defaultChecked />
            Otomatik Yayına güvenilir kaynak (AI düzenleyip SEO uygunlaştırdıktan sonra doğrudan yayınlanır)
          </label>
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Kaynak Ekle</button>
        </form>
      </section>
    </div>
  );
}
