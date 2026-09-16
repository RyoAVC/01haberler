import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { BulkAddForm } from "@/components/admin/BulkAddForm";

export default async function BulkAddArticlesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:create")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-headline-l">Toplu Haber Ekle</h1>
      <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Birden fazla haberi tek seferde ekleyin. Her haberi ayrı bir <code>---</code> satırıyla ayırın; her haberin ilk satırı başlık, kalanı içerik olarak alınır. Eklenen tüm haberler &ldquo;İncelemede&rdquo; durumuna düşer.
      </p>
      <BulkAddForm categories={categories} />
    </div>
  );
}
