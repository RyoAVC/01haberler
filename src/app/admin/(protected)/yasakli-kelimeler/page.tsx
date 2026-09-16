import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { createBannedWord, deleteBannedWord } from "@/server/actions/bannedWordActions";

export default async function AdminBannedWordsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "content-filter:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const words = await prisma.bannedWord.findMany({ orderBy: { word: "asc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-headline-l">Yasaklı Kelimeler ve Filtre</h1>
        <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
          &ldquo;Engelle&rdquo; şiddetindeki kelimeler haber kaydedilirken tespit edilirse kayıt reddedilir.
          &ldquo;İşaretle&rdquo; şiddetindekiler kaydı engellemez, yalnızca bilgi amaçlıdır.
        </p>
      </div>

      <table className="w-full max-w-xl text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Kelime</th>
            <th className="py-2 pr-4">Şiddet</th>
            <th className="py-2 pr-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {words.map((w) => (
            <tr key={w.id} className="border-b border-line dark:border-line-dark">
              <td className="py-2 pr-4">{w.word}</td>
              <td className="py-2 pr-4">{w.severity === "BLOCK" ? "Engelle" : "İşaretle"}</td>
              <td className="py-2 pr-4">
                <form action={deleteBannedWord.bind(null, w.id)}>
                  <button type="submit" className="text-brand-red hover:underline">Sil</button>
                </form>
              </td>
            </tr>
          ))}
          {words.length === 0 && (
            <tr><td colSpan={3} className="py-3 text-ink-secondary dark:text-ink-dark-secondary">Henüz kelime eklenmedi.</td></tr>
          )}
        </tbody>
      </table>

      <section className="max-w-xl border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Kelime Ekle</h2>
        <form action={createBannedWord} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="word" placeholder="kelime" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <select name="severity" defaultValue="FLAG" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark">
            <option value="FLAG">İşaretle (kaydetmeye izin ver)</option>
            <option value="BLOCK">Engelle (kaydetmeyi reddet)</option>
          </select>
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2">Ekle</button>
        </form>
      </section>
    </div>
  );
}
