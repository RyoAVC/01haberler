import { CollectionDetail } from "@/components/newsroom/CollectionPage";
import { getCollection } from "@/server/services/newsroomStore";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sayfa?: string }> };
export async function generateMetadata({ params }: Props) {
 const { slug } = await params; const item = await getCollection(slug);
 return item && item.kind === "konu" ? { title: item.title, description: item.summary.slice(0, 160), alternates: { canonical: "/konu/" + slug } } : { robots: { index: false } };
}
export default async function Page({ params, searchParams }: Props) {
 const [{ slug }, q] = await Promise.all([params, searchParams]);
 return <CollectionDetail kind="konu" slug={slug} page={Math.max(1, Math.floor(Number(q.sayfa) || 1))} />;
}
