import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { updateSiteSetting } from "@/server/actions/settingsActions";
import { addImageAllowlistDomain, removeImageAllowlistDomain } from "@/server/actions/imageAllowlistActions";
import { getImageAllowlistDomains } from "@/server/services/imageAllowlistService";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const [settings, imageAllowlist] = await Promise.all([
    prisma.siteSetting.findMany({
      where: { key: { in: ["ads_txt_content", "site_meta_description"] } },
    }),
    getImageAllowlistDomains(),
  ]);
  const byKey = new Map(settings.map((s) => [s.key, s.value as string]));

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="font-serif text-headline-l">Site Ayarları</h1>

      <section>
        <h2 className="font-serif text-headline-m">ads.txt</h2>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Google AdSense/Ad Manager yetkilendirmesi için gereken ads.txt içeriğini buraya yapıştırın. İçerik
          <code className="mx-1 rounded bg-neutral-100 px-1 dark:bg-neutral-800">/ads.txt</code>
          adresinden düz metin olarak sunulur.
        </p>
        <form action={updateSiteSetting.bind(null, "ads_txt_content")} className="mt-3">
          <textarea
            name="value"
            rows={6}
            defaultValue={byKey.get("ads_txt_content") ?? ""}
            placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
            className="w-full border border-line bg-transparent px-3 py-2 font-mono text-caption dark:border-line-dark"
          />
          <button type="submit" className="mt-2 bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
            Kaydet
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-serif text-headline-m">Varsayılan SEO Açıklaması</h2>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Sayfa bazlı açıklaması olmayan durumlarda kullanılacak genel site açıklaması.
        </p>
        <form action={updateSiteSetting.bind(null, "site_meta_description")} className="mt-3">
          <textarea
            name="value"
            rows={2}
            defaultValue={byKey.get("site_meta_description") ?? ""}
            className="w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
          />
          <button type="submit" className="mt-2 bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
            Kaydet
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-serif text-headline-m">Görsele İzin Verilen Domainler</h2>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Botun çektiği haberlerdeki görseller yalnızca bu listedeki domainlerden (ve alt domainlerinden) kabul edilir; telif riskini önlemek için diğerleri yerine güvenli bir placeholder kullanılır. Yeni bir kaynak eklediğinizde o kaynağın domaini otomatik eklenir.
        </p>
        <ul className="mt-3 space-y-1">
          {imageAllowlist.map((domain) => (
            <li key={domain} className="flex items-center justify-between border border-line px-3 py-2 text-headline-s dark:border-line-dark">
              {domain}
              <form action={removeImageAllowlistDomain.bind(null, domain)}>
                <button type="submit" className="text-caption text-brand-red hover:underline">Sil</button>
              </form>
            </li>
          ))}
          {imageAllowlist.length === 0 && (
            <li className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Henüz izin verilen domain yok.</li>
          )}
        </ul>
        <form action={addImageAllowlistDomain} className="mt-3 flex gap-2">
          <input name="domain" placeholder="ornek-kaynak.com" required className="flex-1 border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <button type="submit" className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">Ekle</button>
        </form>
      </section>
    </div>
  );
}
