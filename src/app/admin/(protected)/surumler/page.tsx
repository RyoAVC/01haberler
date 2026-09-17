import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";
import { getReleaseNotes } from "@/server/services/releaseNoteService";
import { saveReleaseNote, deleteReleaseNoteAction } from "@/server/actions/releaseNoteActions";
import { softwareRelease } from "@/lib/softwareRelease";

const TYPE_LABEL: Record<string, string> = {
  FEATURE: "Yeni Özellik",
  FIX: "Düzeltme",
  IMPROVEMENT: "İyileştirme",
  SECURITY: "Güvenlik",
};

export default async function AdminReleaseNotesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "changelog:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const releaseNotes = await getReleaseNotes({ includeDrafts: true });

  return (
    <div>
      <h1 className="font-serif text-headline-l">Sürümler / Değişiklik Günlüğü</h1>
      <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Yazılımda yapılan her değişikliği bir sürüm numarasına bağlayarak kaydedin.
      </p>

      <div className="mt-6 space-y-6">
        {!releaseNotes.some(note => note.version === softwareRelease.version) && <section className="module-card"><p className="eyebrow">BU YAZILIMLA GELEN SÜRÜM</p><h2 className="my-3 font-serif text-headline-m">{softwareRelease.version} — {softwareRelease.title}</h2><p className="text-caption">{softwareRelease.date} · Kaynak koduyla birlikte sürümlenir.</p><ul className="mt-3 list-disc space-y-2 pl-5">{softwareRelease.items.map(item => <li key={item}>{item}</li>)}</ul></section>}
        {releaseNotes.map((note) => (
          <section key={note.id} className="border border-line p-4 dark:border-line-dark">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-headline-m">
                {note.version} — {note.title} {note.isDraft && <span className="text-caption text-ink-secondary">(taslak)</span>}
              </h2>
              <form action={deleteReleaseNoteAction.bind(null, note.id)}>
                <button type="submit" className="text-caption text-brand-red hover:underline">Sil</button>
              </form>
            </div>
            <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">{formatDateTr(note.releasedAt)}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-headline-s">
              {note.items.map((item) => (
                <li key={item.id}>
                  <span className="text-caption text-ink-secondary dark:text-ink-dark-secondary">[{TYPE_LABEL[item.changeType]}]</span>{" "}
                  {item.description}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {releaseNotes.length === 0 && (
          <p className="text-ink-secondary dark:text-ink-dark-secondary">Henüz sürüm kaydı yok.</p>
        )}
      </div>

      <section className="mt-10 border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Yeni Sürüm Ekle / Güncelle</h2>
        <form action={saveReleaseNote} className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="version" placeholder="1.1.0" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
            <input name="title" placeholder="Başlık" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </div>
          <textarea
            name="items"
            rows={5}
            placeholder={"Her satır bir değişiklik. İsteğe bağlı önek: FEATURE:, FIX:, IMPROVEMENT:, SECURITY:\nÖrn: FEATURE: Toplu haber onaylama eklendi"}
            className="border border-line bg-transparent px-3 py-2 dark:border-line-dark"
          />
          <label className="flex items-center gap-2 text-headline-s">
            <input type="checkbox" name="isDraft" className="h-4 w-4" /> Taslak (herkese açık sayfada gösterme)
          </label>
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:w-fit">Kaydet</button>
        </form>
      </section>
    </div>
  );
}
