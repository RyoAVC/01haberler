import { CollectionIndex } from "@/components/newsroom/CollectionPage";
import { LocalCityArticles } from "@/components/newsroom/LocalCityArticles";
export const dynamic = "force-dynamic";
export const metadata = { title: "Yerel haber merkezi", alternates: { canonical: "/yerel" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ sayfa?: string; sehir?: string }> }) {
 const q = await searchParams;
 const city = (q.sehir ?? "").slice(0, 80);
 return <>
   <div className="container-page pt-8"><LocalCityArticles city={city} /></div>
   <CollectionIndex kind="yerel" page={Math.max(1, Math.floor(Number(q.sayfa) || 1))} city={city} />
 </>;
}
