import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { getFooterLinks } from "@/server/services/footerLinksService";
import { addFooterLink, removeFooterLink, moveFooterLink } from "@/server/actions/menuActions";

export default async function AdminMenuPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const links = await getFooterLinks();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-headline-l">Menü ve Footer</h1>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Ana kategori menüsü <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">/admin/kategoriler</code> sayfasındaki
          sıralama ve aktiflik ayarlarından yönetilir. Burada yalnızca footer&apos;daki &ldquo;Kurumsal&rdquo; bağlantı listesi düzenlenir.
        </p>
      </div>

      <table className="w-full text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Etiket</th>
            <th className="py-2 pr-4">Bağlantı</th>
            <th className="py-2 pr-4">Sıra</th>
            <th className="py-2 pr-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link, index) => (
            <tr key={`${link.href}-${index}`} className="border-b border-line dark:border-line-dark">
              <td className="py-2 pr-4">{link.label}</td>
              <td className="py-2 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">{link.href}</td>
              <td className="py-2 pr-4">
                <div className="flex gap-2">
                  <form action={moveFooterLink.bind(null, index, "up")}>
                    <button type="submit" disabled={index === 0} className="disabled:opacity-30">↑</button>
                  </form>
                  <form action={moveFooterLink.bind(null, index, "down")}>
                    <button type="submit" disabled={index === links.length - 1} className="disabled:opacity-30">↓</button>
                  </form>
                </div>
              </td>
              <td className="py-2 pr-4">
                <form action={removeFooterLink.bind(null, index)}>
                  <button type="submit" className="text-brand-red hover:underline">Sil</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Bağlantı Ekle</h2>
        <form action={addFooterLink} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="label" placeholder="Görünen ad (ör. Künye)" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="href" placeholder="/kunye veya https://..." required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Ekle</button>
        </form>
      </section>
    </div>
  );
}
