import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { createCategory, toggleCategoryActive } from "@/server/actions/taxonomyActions";

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "category:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { articles: true } } },
  });

  const parentOptions = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-headline-l">Kategoriler</h1>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Adana gibi alt kategoriler için üst kategori olarak &ldquo;Yerel Haberler&rdquo;i seçin.
        </p>
      </div>

      <table className="w-full text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Ad</th>
            <th className="py-2 pr-4">Slug</th>
            <th className="py-2 pr-4">Üst Kategori</th>
            <th className="py-2 pr-4">Haber Sayısı</th>
            <th className="py-2 pr-4">Durum</th>
            <th className="py-2 pr-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-line dark:border-line-dark">
              <td className="py-2 pr-4">{c.name}</td>
              <td className="py-2 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">{c.slug}</td>
              <td className="py-2 pr-4">{c.parent?.name ?? "—"}</td>
              <td className="py-2 pr-4">{c._count.articles}</td>
              <td className="py-2 pr-4">{c.isActive ? "Aktif" : "Pasif"}</td>
              <td className="py-2 pr-4">
                <form action={toggleCategoryActive.bind(null, c.id, !c.isActive)}>
                  <button type="submit" className="text-brand-red hover:underline">
                    {c.isActive ? "Pasifleştir" : "Etkinleştir"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Kategori</h2>
        <form action={createCategory} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Kategori adı" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="slug" placeholder="kategori-slug" required pattern="[a-z0-9-]+" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <select name="parentId" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark">
            <option value="">Üst kategori yok</option>
            {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input name="sortOrder" type="number" placeholder="Sıra (0)" defaultValue={0} className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="seoTitle" placeholder="SEO başlık (opsiyonel)" className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
          <textarea name="seoDescription" placeholder="SEO açıklama (opsiyonel)" rows={2} className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Kategori Ekle</button>
        </form>
      </section>
    </div>
  );
}
