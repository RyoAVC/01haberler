import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";
import { createUser, toggleUserActive, changeUserRole } from "@/server/actions/userActions";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Süper Yönetici",
  EDITOR: "Editör",
  AUTHOR: "Yazar",
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser.role, "users:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-headline-l">Kullanıcılar</h1>

      <table className="w-full text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Ad</th>
            <th className="py-2 pr-4">E-posta</th>
            <th className="py-2 pr-4">Rol</th>
            <th className="py-2 pr-4">Son Giriş</th>
            <th className="py-2 pr-4">Durum</th>
            <th className="py-2 pr-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line dark:border-line-dark">
              <td className="py-2 pr-4">{u.name}</td>
              <td className="py-2 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">{u.email}</td>
              <td className="py-2 pr-4">
                {u.id === currentUser?.id ? (
                  ROLE_LABEL[u.role]
                ) : (
                  <form action={changeUserRole.bind(null, u.id)} className="inline">
                    <select
                      name="role"
                      defaultValue={u.role}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="border border-line bg-transparent px-1 py-0.5 dark:border-line-dark"
                    >
                      {Object.entries(ROLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </form>
                )}
              </td>
              <td className="py-2 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">
                {u.lastLoginAt ? formatDateTr(u.lastLoginAt) : "—"}
              </td>
              <td className="py-2 pr-4">{u.isActive ? "Aktif" : "Pasif"}</td>
              <td className="py-2 pr-4">
                {u.id !== currentUser?.id && (
                  <form action={toggleUserActive.bind(null, u.id, !u.isActive)}>
                    <button type="submit" className="text-brand-red hover:underline">
                      {u.isActive ? "Devre Dışı Bırak" : "Etkinleştir"}
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="max-w-xl border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Kullanıcı</h2>
        <form action={createUser} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Ad Soyad" required className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
          <input name="email" type="email" placeholder="E-posta" required className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
          <input name="password" type="password" placeholder="Parola (en az 8 karakter)" required minLength={8} className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark" />
          <select name="role" defaultValue="AUTHOR" className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark">
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Kullanıcı Ekle</button>
        </form>
      </section>
    </div>
  );
}
