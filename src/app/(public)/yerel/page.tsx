import { CollectionIndex } from "@/components/newsroom/CollectionPage";
export const dynamic = "force-dynamic";
export const metadata = { title: "Yerel haber merkezi", alternates: { canonical: "/yerel" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ sayfa?: string; sehir?: string }> }) {
 const q = await searchParams;
 return <CollectionIndex kind="yerel" page={Math.max(1, Math.floor(Number(q.sayfa) || 1))} city={(q.sehir ?? "").slice(0, 80)} />;
}
