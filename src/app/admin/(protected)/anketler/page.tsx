import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { savePoll, deletePollAction, togglePollActiveAction } from "@/server/actions/pollActions";

export default async function AdminPollsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "polls:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  });

  return (
    <div>
      <h1 className="font-serif text-headline-l">Anketler</h1>

      <div className="mt-6 space-y-4">
        {polls.map((poll) => (
          <div key={poll.id} className="border border-line p-4 dark:border-line-dark">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-headline-m">{poll.question}</h2>
              <span className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{poll.isActive ? "Aktif" : "Pasif"}</span>
            </div>
            <ul className="mt-2 text-headline-s">
              {poll.options.map((o) => (
                <li key={o.id}>{o.label} — {o._count.votes} oy</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-3 text-headline-s">
              <form action={togglePollActiveAction.bind(null, poll.id, !poll.isActive)}>
                <button type="submit" className="hover:underline">{poll.isActive ? "Devre Dışı Bırak" : "Etkinleştir"}</button>
              </form>
              <form action={deletePollAction.bind(null, poll.id)}>
                <button type="submit" className="text-brand-red hover:underline">Sil</button>
              </form>
            </div>
          </div>
        ))}
        {polls.length === 0 && <p className="text-ink-secondary dark:text-ink-dark-secondary">Henüz anket yok.</p>}
      </div>

      <section className="mt-10 border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Anket Ekle</h2>
        <form action={savePoll} className="mt-3 grid gap-3">
          <input name="question" placeholder="Anket sorusu" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="options" placeholder="Seçenek 1" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="options" placeholder="Seçenek 2" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="options" placeholder="Seçenek 3 (opsiyonel)" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <input name="options" placeholder="Seçenek 4 (opsiyonel)" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:w-fit">Oluştur</button>
        </form>
      </section>
    </div>
  );
}
