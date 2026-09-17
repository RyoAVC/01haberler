import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { listCollections, getCollection, getLiveEntries } from "@/server/services/newsroomStore";
import { saveCollectionAction, saveLiveEntryAction } from "@/server/actions/newsroomActions";
import { ActionForm } from "@/components/admin/ActionForm";

export default async function DossiersAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; page?: string; entries?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:publish")) return <p>Editör yetkisi gerekli.</p>;
  const q = await searchParams;
  const page = Math.max(1, Math.min(1000, Number(q.page) || 1));
  const [items, editing, articles] = await Promise.all([
    listCollections(undefined, false, page), q.edit ? getCollection(q.edit, false) : null,
    prisma.article.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 150, select: { id: true, title: true } }),
  ]);
  const entryPage = Math.max(1, Number(q.entries) || 1);
  const entries = editing?.kind === "canli" ? await getLiveEntries(editing.slug, entryPage) : [];
  return <div className="space-y-8"><header><p className="eyebrow">YAYIN MERKEZİ</p><h1 className="font-serif text-headline-l">Konu, yerel ve canlı dosyaları</h1><p className="mt-2">Haberleri bağlamıyla bir araya getirin. Taslaklar yalnızca yönetimde görünür.</p></header>
    <ActionForm key={editing?.updatedAt ?? "new"} action={saveCollectionAction}>
      <h2 className="font-serif text-headline-m">{editing ? "Dosyayı düzenle" : "Yeni dosya"}</h2>
      <input type="hidden" name="expected" value={editing?.updatedAt ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2"><label>Tür<select name="kind" defaultValue={editing?.kind ?? "konu"}>{[["konu", "Konu dosyası"], ["yerel", "Yerel merkez"], ["canli", "Canlı anlatım"]].filter(([kind]) => !editing || kind === editing.kind).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label><label>Adres<input name="slug" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" readOnly={!!editing} defaultValue={editing?.slug} placeholder="ornek-konu" /></label></div>
      <label>Başlık<input name="title" required minLength={3} maxLength={160} defaultValue={editing?.title} /></label>
      <label>Dosya özeti<textarea name="summary" required minLength={10} maxLength={4000} rows={4} defaultValue={editing?.summary} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label>Şehir<input name="city" maxLength={80} defaultValue={editing?.city} /></label><label>İlçe<input name="district" maxLength={80} defaultValue={editing?.district} /></label></div>
      <label>İlgili kişi ve kurumlar<textarea name="people" rows={2} maxLength={1000} defaultValue={editing?.people} placeholder="Her satıra bir kişi veya kurum" /></label>
      <label>İlgili haber kimlikleri<textarea name="articleIds" rows={3} defaultValue={editing?.articleIds.join("\n")} placeholder="Her satıra bir haber kimliği; en fazla 100 haber" /></label>
      <details><summary>Haber kimliklerini bul</summary><ul className="max-h-64 overflow-auto text-caption">{articles.map(a => <li key={a.id} className="border-b border-line-dark py-2">{a.title}<br /><code className="select-all">{a.id}</code></li>)}</ul></details>
      <label>Yayın durumu<select name="status" defaultValue={editing?.status ?? "DRAFT"}><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option><option value="CLOSED">Tamamlandı (arşiv olarak görünür)</option></select></label>
      <button className="module-button">Dosyayı kaydet</button> {editing && <Link href="/admin/dosyalar" className="ml-3 underline">Yeni dosya aç</Link>}
    </ActionForm>
    {editing?.kind === "canli" && <section className="space-y-4"><h2 className="font-serif text-headline-m">Canlı gelişmeler</h2>
      {editing.status !== "CLOSED" && <ActionForm action={saveLiveEntryAction}><input type="hidden" name="collection" value={editing.slug} /><label>Gelişme başlığı<input name="title" required maxLength={180} /></label><label>Metin<textarea name="body" required minLength={3} maxLength={6000} rows={4} /></label><label>Kaynak adresi<input name="sourceUrl" type="url" maxLength={2000} /></label><label className="flex gap-2"><input name="pinned" type="checkbox" />Bu gelişmeyi sabitle</label><button className="module-button">Gelişme ekle</button></ActionForm>}
      {entries.map(e => <details key={e.id} className="module-card"><summary>{e.pinned ? "★ " : ""}{e.title}</summary><ActionForm key={e.updatedAt} action={saveLiveEntryAction}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="expected" value={e.updatedAt} /><input type="hidden" name="collection" value={editing.slug} /><label>Başlık<input name="title" defaultValue={e.title} required maxLength={180} /></label><label>Metin<textarea name="body" defaultValue={e.body} required maxLength={6000} rows={4} /></label><label>Kaynak<input name="sourceUrl" type="url" defaultValue={e.sourceUrl} /></label><label>Düzeltme notu<input name="correction" required maxLength={500} /></label><label className="flex gap-2"><input name="pinned" type="checkbox" defaultChecked={e.pinned} />Sabitle</label><button className="module-button">Gelişmeyi güncelle</button></ActionForm></details>)}
      <div className="flex justify-between">{entryPage > 1 && <Link href={`?edit=${editing.slug}&entries=${entryPage - 1}`}>Önceki gelişmeler</Link>}{entries.length === 50 && <Link href={`?edit=${editing.slug}&entries=${entryPage + 1}`}>Daha eski gelişmeler →</Link>}</div>
    </section>}
    <section><h2 className="font-serif text-headline-m">Dosyalar</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(item => <article key={item.slug} className="module-card"><p className="eyebrow">{item.kind} · {item.status}</p><h3 className="my-2 font-serif text-headline-m">{item.title}</h3><Link href={`/admin/dosyalar?edit=${item.slug}`} className="underline">Düzenle</Link>{item.status !== "DRAFT" && <Link className="ml-4 underline" href={`/${item.kind}/${item.slug}`}>Yayını aç ↗</Link>}</article>)}</div>{!items.length && <p className="mt-4">Henüz dosya yok.</p>}<nav className="mt-4 flex justify-between">{page > 1 ? <Link href={`?page=${page - 1}`}>← Önceki</Link> : <span />}{items.length === 25 && <Link href={`?page=${page + 1}`}>Sonraki →</Link>}</nav></section>
  </div>;
}
