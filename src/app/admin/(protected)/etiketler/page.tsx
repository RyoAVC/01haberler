import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { createTag, deleteTag } from "@/server/actions/taxonomyActions";

export default async function AdminTagsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "category:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-headline-l">Etiketler</h1>

      <table className="w-full max-w-xl text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Ad</th>
            <th className="py-2 pr-4">Haber Sayısı</th>
            <th className="py-2 pr-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((t) => (
            <tr key={t.id} className="border-b border-line dark:border-line-dark">
              <td className="py-2 pr-4">{t.name}</td>
              <td className="py-2 pr-4">{t._count.articles}</td>
              <td className="py-2 pr-4">
                <form action={deleteTag.bind(null, t.id)}>
                  <button type="submit" className="text-brand-red hover:underline" disabled={t._count.articles > 0}>
                    Sil
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {tags.length === 0 && (
            <tr><td colSpan={3} className="py-3 text-ink-secondary dark:text-ink-dark-secondary">Henüz etiket yok.</td></tr>
          )}
        </tbody>
      </table>

      <section className="max-w-xl border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Etiket</h2>
        <form action={createTag} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Etiket adı" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="slug" placeholder="etiket-slug" required pattern="[a-z0-9-]+" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Etiket Ekle</button>
        </form>
      </section>
    </div>
  );
}
