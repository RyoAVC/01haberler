import { FollowingList } from "@/components/newsroom/FollowButton";
export const metadata = { title: "Takip ettiklerim", robots: { index: false } };
export default function FollowingPage() { return <div className="container-page py-10"><header className="module-heading"><p className="eyebrow">SİZE ÖZEL</p><h1>Takip ettiklerim</h1><p>Konu, yerel dosya, canlı anlatım ve yazar tercihleriniz bu tarayıcıda saklanır. Hesaplar arasında eşitlenmez ve otomatik bildirim göndermez.</p></header><FollowingList /></div>; }
