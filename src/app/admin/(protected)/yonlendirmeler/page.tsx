import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { listRedirects } from "@/server/services/redirectService";
import { saveRedirect, deleteRedirectAction, toggleRedirectActiveAction } from "@/server/actions/redirectActions";

export default async function AdminRedirectsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "redirects:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const redirects = await listRedirects();

  return (
    <div>
      <h1 className="font-serif text-headline-l">301 Yönlendirmeler</h1>
      <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Eski bir URL&apos;yi yeni bir adrese kalıcı olarak yönlendirin (SEO için önemlidir).
      </p>

      <table className="mt-6 w-full text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Kaynak Yol</th>
            <th className="py-2 pr-4">Hedef Yol</th>
            <th className="py-2 pr-4">Kod</th>
            <th className="py-2 pr-4">Durum</th>
            <th className="py-2 pr-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {redirects.map((r) => (
            <tr key={r.id} className="border-b border-line dark:border-line-dark">
              <td className="max-w-xs truncate py-2 pr-4">{r.fromPath}</td>
              <td className="max-w-xs truncate py-2 pr-4">{r.toPath}</td>
              <td className="py-2 pr-4">{r.statusCode}</td>
              <td className="py-2 pr-4">{r.isActive ? "Aktif" : "Pasif"}</td>
              <td className="py-2 pr-4">
                <div className="flex gap-3">
                  <form action={toggleRedirectActiveAction.bind(null, r.id, !r.isActive)}>
                    <button type="submit" className="hover:underline">{r.isActive ? "Devre Dışı Bırak" : "Etkinleştir"}</button>
                  </form>
                  <form action={deleteRedirectAction.bind(null, r.id)}>
                    <button type="submit" className="text-brand-red hover:underline">Sil</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {redirects.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-ink-secondary dark:text-ink-dark-secondary">Kayıt bulunamadı.</td></tr>
          )}
        </tbody>
      </table>

      <form action={saveRedirect} className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
        <input name="fromPath" placeholder="/eski-yol" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        <input name="toPath" placeholder="/yeni-yol" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        <select name="statusCode" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark">
          <option value="301">301 (Kalıcı)</option>
          <option value="302">302 (Geçici)</option>
        </select>
        <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark">Ekle</button>
      </form>
    </div>
  );
}
