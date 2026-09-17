"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FOLLOWING_KEY, parseFollowing, type FollowedItem } from "@/lib/utils/following";
export function FollowButton({ item }: { item: FollowedItem }) {
  const [active, setActive] = useState(false), [error, setError] = useState("");
  useEffect(() => { const sync = () => { try { setActive(parseFollowing(localStorage.getItem(FOLLOWING_KEY)).some(i => i.href === item.href)); } catch { /* Storage may be disabled. */ } }; sync(); window.addEventListener("storage", sync); window.addEventListener("following-changed", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("following-changed", sync); }; }, [item.href]);
  return <span><button type="button" className="rounded-full border border-current px-4 py-2 text-caption" aria-pressed={active} onClick={() => { try { const all = parseFollowing(localStorage.getItem(FOLLOWING_KEY)); const has = all.some(i => i.href === item.href); if (!has && all.length >= 100) { setError("En fazla 100 dosya takip edebilirsiniz."); return; } localStorage.setItem(FOLLOWING_KEY, JSON.stringify(has ? all.filter(i => i.href !== item.href) : [item, ...all])); setActive(!has); setError(""); window.dispatchEvent(new Event("following-changed")); } catch { setError("Tarayıcı kaydına erişilemiyor."); } }}>{active ? "Takip ediliyor ✓" : "Takip et +"}</button>{error && <span role="status" className="ml-2 text-caption">{error}</span>}</span>;
}
export function FollowingList() {
  const [items, setItems] = useState<FollowedItem[] | null>(null);
  useEffect(() => { const sync = () => { try { setItems(parseFollowing(localStorage.getItem(FOLLOWING_KEY))); } catch { setItems([]); } }; sync(); window.addEventListener("following-changed", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("following-changed", sync); window.removeEventListener("storage", sync); }; }, []);
  return <div className="space-y-4">{items === null ? <p>Yükleniyor…</p> : !items.length ? <p>Takip listeniz boş. Konu dosyalarındaki veya yazar sayfalarındaki “Takip et” düğmesini kullanın.</p> : items.map(item => <article key={item.href} className="module-card flex flex-wrap items-center justify-between gap-3"><Link href={item.href} className="font-serif text-headline-m">{item.title}</Link><FollowButton item={item} /></article>)}</div>;
}
