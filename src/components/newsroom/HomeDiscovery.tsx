import Link from "next/link";
import { listCollections } from "@/server/services/newsroomStore";
const links: [string, string, string][] = [["/konu", "Konu dosyaları", "Gündemin arka planı"], ["/yerel", "Yerel gündem", "Şehrinizin haberleri"], ["/canli", "Canlı anlatım", "Gelişmeler, saat saat"], ["/ihbar", "Söz sizde", "İhbar ve düzeltme"]];
export async function HomeDiscovery() {
  const items = (await listCollections()).slice(0, 3);
  return <section aria-label="Haber merkezini keşfet" className="my-8"><div className="discovery-nav">{links.map(([href, title, subtitle]) => <Link key={href} href={href}><span>{title} <span aria-hidden>↗</span></span><small>{subtitle}</small></Link>)}</div>
    {items.length > 0 && <div className="mt-5 grid gap-4 md:grid-cols-3">{items.map(item => <Link href={`/${item.kind}/${item.slug}`} key={item.slug} className="module-card"><span className="eyebrow">{item.kind === "canli" ? item.status === "CLOSED" ? "ANLATIM TAMAMLANDI" : "CANLI ANLATIM" : item.kind === "yerel" ? item.city : "KONU DOSYASI"}</span><h2 className="my-3 font-serif text-headline-m">{item.title}</h2><p className="line-clamp-2 text-caption">{item.summary}</p></Link>)}</div>}</section>;
}
