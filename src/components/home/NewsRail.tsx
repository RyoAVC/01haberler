import Link from "next/link";
type Item = { id: string; slug: string; title: string };
export function NewsRail({ side, articles }: { side: "left" | "right"; articles: Item[] }) {
  const categories = [["gundem", "Gündem"], ["ekonomi", "Ekonomi"], ["dunya", "Dünya"], ["teknoloji", "Teknoloji"], ["spor", "Spor"]];
  return <div className="news-rail-content">
    <section className="rail-panel"><h2>{side === "left" ? "HABER ROTASI" : "ÇOK OKUNANLAR"}</h2>{side === "left" ? <nav aria-label="Kenar kategori bağlantıları">{categories.map(([slug, label]) => <Link key={slug} href={`/kategori/${slug}`}>{label}<span aria-hidden="true">↗</span></Link>)}</nav> : <ol>{articles.slice(0, 4).map((a, i) => <li key={a.id}><span className="rail-number">0{i + 1}</span><Link href={`/haber/${a.slug}`}>{a.title}</Link></li>)}</ol>}</section>
    {side === "left" && <section className="rail-panel"><h2>SON GELİŞMELER</h2><ul>{articles.slice(0, 3).map(a => <li key={a.id}><Link href={`/haber/${a.slug}`}>{a.title}</Link></li>)}</ul><Link className="rail-more" href="/son-haberler">Tüm haberler →</Link></section>}
    {side === "right" && <section className="rail-panel rail-community"><h2>HABERE KATILIN</h2><p>Bir gelişme gördünüz mü?</p><Link href="/ihbar">Editöre iletin ↗</Link><Link href="/takip">Takip ettiklerim →</Link></section>}
  </div>;
}
