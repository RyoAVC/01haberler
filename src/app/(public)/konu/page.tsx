import { CollectionIndex } from "@/components/newsroom/CollectionPage";
export const dynamic = "force-dynamic";
export const metadata = { title: "Konu dosyaları", alternates: { canonical: "/konu" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ sayfa?: string; sehir?: string }> }) {
 const q = await searchParams;
 return <CollectionIndex kind="konu" page={Math.max(1, Math.floor(Number(q.sayfa) || 1))} city={(q.sehir ?? "").slice(0, 80)} />;
}
