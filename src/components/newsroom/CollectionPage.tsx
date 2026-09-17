import { LiveRefresh } from "./LiveRefresh";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getLiveEntries, getLiveEntry, listCollections } from "@/server/services/newsroomStore";
import type { NewsCollection } from "@/lib/validation/newsroom";
import { prisma } from "@/lib/db";
import { ArticleCard } from "@/components/article/ArticleCard";
import { PUBLIC_ARTICLE_CARD_SELECT } from "@/server/services/articleService";
import { FollowButton } from "./FollowButton";
const labels = { konu: "Konu dosyaları", yerel: "Yerel haber merkezi", canli: "Canlı anlatım" };
export async function CollectionIndex({ kind, page = 1, city = "" }: { kind: NewsCollection["kind"]; page?: number; city?: string }) {
  const items = await listCollections(kind, true, page, city);
  const shown = items;
  return <div className="container-page py-10"><header className="module-heading"><p className="eyebrow">01 HABERLER · KEŞFET</p><h1>{labels[kind]}</h1><p>Gelişmeleri bağlamı ve kaynaklarıyla takip edin.</p></header>
    {kind === "yerel" && <form className="module-form mb-6"><label>Şehir seçimi (konum izni gerekmez)<input name="sehir" defaultValue={city} placeholder="Örn. Adana" maxLength={80} /></label><button className="module-button mt-3">Göster</button></form>}
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{shown.map(item => <Link className="module-card hover:border-brand-red" key={item.slug} href={`/${kind}/${item.slug}`}><p className="eyebrow">{kind === "yerel" ? [item.city, item.district].filter(Boolean).join(" / ") : item.status === "CLOSED" ? "TAMAMLANDI" : labels[kind]}</p><h2 className="my-3 font-serif text-headline-m">{item.title}</h2><p className="line-clamp-3 text-ink-secondary dark:text-ink-dark-secondary">{item.summary}</p><span className="mt-5 inline-block text-brand-red">Dosyayı aç →</span></Link>)}</div>
    {!shown.length && <div className="module-card"><h2 className="font-serif text-headline-m">Henüz yayınlanmış dosya bulunmuyor.</h2><p className="mt-2">Editörler dosyaları yayımladığında burada görünecek.</p><Link href="/son-haberler" className="mt-3 inline-block underline">Son haberlere git</Link></div>}
    <nav className="mt-6 flex justify-between">{page > 1 ? <Link href={`?sayfa=${page - 1}&sehir=${encodeURIComponent(city)}`}>← Önceki</Link> : <span />}{items.length === 25 && <Link href={`?sayfa=${page + 1}&sehir=${encodeURIComponent(city)}`}>Sonraki →</Link>}</nav></div>;
}
export async function CollectionDetail({ kind, slug, page = 1, selected = "" }: { kind: NewsCollection["kind"]; slug: string; page?: number; selected?: string }) {
  const item = await getCollection(slug);
  if (!item || item.kind !== kind) notFound();
  const [articles, entries] = await Promise.all([
    prisma.article.findMany({ where: { id: { in: item.articleIds }, status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: PUBLIC_ARTICLE_CARD_SELECT }),
    kind === "canli" ? getLiveEntries(slug, page) : Promise.resolve([] as Awaited<ReturnType<typeof getLiveEntries>>),
  ]);
  articles.sort((a, b) => item.articleIds.indexOf(a.id) - item.articleIds.indexOf(b.id));
  const hasMore = entries.length === 50;
  if (kind === "canli" && selected) { const entry = await getLiveEntry(slug, selected); if (!entry) notFound(); if (!entries.some(e => e.id === entry.id)) entries.unshift(entry); }
  return <div className="container-page py-10"><header className="module-heading"><Link className="eyebrow" href={`/${kind}`}>{labels[kind]} ↗</Link><h1>{item.title}</h1><p className="whitespace-pre-line">{item.summary}</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-caption">{item.status === "CLOSED" ? "Anlatım tamamlandı" : "Editör dosyası"} · {new Date(item.updatedAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</span><FollowButton item={{ title: item.title, href: `/${kind}/${slug}` }} /></div></header>
    {item.people && <aside className="module-card mb-6"><h2 className="font-serif text-headline-m">Kişiler ve kurumlar</h2><ul className="mt-2 space-y-1">{item.people.split(/\r?\n/).filter(Boolean).map((p, i) => <li key={i}><Link className="underline" href={`/arama?q=${encodeURIComponent(p)}`}>{p}</Link></li>)}</ul></aside>}
    {kind === "canli" && <section aria-label="Canlı gelişmeler" className="mb-10"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-headline-m">Gelişmeler</h2><Link href={`/canli/${slug}`} className="text-caption underline">Akışı yenile</Link></div><LiveRefresh active={item.status === "PUBLISHED" && page === 1 && !selected} latestAt={[item.updatedAt, ...entries.map(e => e.updatedAt)].sort().at(-1)!} />{!entries.length && <p>Henüz gelişme eklenmedi.</p>}
      <div className="space-y-4">{entries.map(e => <article key={e.id} id={e.id} className="module-card border-l-4 border-l-brand-red"><p className="text-caption">{e.pinned && "★ Sabitlenen gelişme · "}<time dateTime={e.publishedAt}>{new Date(e.publishedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</time></p><h3 className="my-3 font-serif text-headline-m">{e.title}</h3><p className="whitespace-pre-line leading-relaxed">{e.body}</p>{e.correction && <p className="mt-3 text-caption">Düzeltme: {e.correction}</p>}<div className="mt-4 flex gap-4 text-caption">{e.sourceUrl && <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Kaynak ↗</a>}<Link className="underline" href={`/canli/${slug}?gelisme=${encodeURIComponent(e.id)}#${e.id}`}>Bu gelişmenin bağlantısı</Link></div></article>)}</div>
      <nav className="mt-4 flex justify-between">{page > 1 ? <Link href={`?sayfa=${page - 1}`}>Daha yeni gelişmeler</Link> : <span />}{hasMore && <Link href={`?sayfa=${page + 1}`}>Daha eski gelişmeler →</Link>}</nav></section>}
    <section><h2 className="mb-5 font-serif text-headline-l">Dosyadaki haberler</h2>{!articles.length && <p>Bu dosyaya henüz haber bağlanmadı.</p>}<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.map(a => <ArticleCard key={a.id} article={a} />)}</div></section></div>;
}
