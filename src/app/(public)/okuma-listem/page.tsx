import { ReadingList } from "@/components/article/ReadingList";
export const metadata = { title: "Okuma Listem", robots: { index: false, follow: true } };
export default function ReadingListPage() {
  return <div className="container-page max-w-3xl py-10"><span className="eyebrow">SİZE AYRILAN BİR SAYFA</span><h1 className="mt-3 font-serif text-display-sm">Okuma listem</h1><p className="mt-3 text-body text-ink-secondary dark:text-ink-dark-secondary">En fazla 100 haber bu tarayıcıda saklanır. Hesap gerekmez; tarayıcı verileri temizlendiğinde liste silinir.</p><ReadingList /></div>;
}
