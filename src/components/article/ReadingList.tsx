"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { parseReadingList, READING_LIST_KEY, type SavedArticle } from "@/lib/utils/readingList";
export function ReadingList() {
  const [items, setItems] = useState<SavedArticle[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => { try { setItems(parseReadingList(localStorage.getItem(READING_LIST_KEY))); } catch { setError("Tarayıcı depolamasına erişilemiyor."); } setReady(true); };
    sync(); window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  function remove(slug: string) {
    try { const next = parseReadingList(localStorage.getItem(READING_LIST_KEY)).filter(a => a.slug !== slug); localStorage.setItem(READING_LIST_KEY, JSON.stringify(next)); setItems(next); }
    catch { setError("Kayıt kaldırılamadı."); }
  }
  return <div className="mt-8">{error && <p role="alert">{error}</p>}{!ready ? <p>Okuma listeniz yükleniyor…</p> : !items.length ? <div className="rounded-xl border border-line p-8 dark:border-line-dark"><h2 className="font-serif text-headline-m">İyi bir haberi sonraya bırakabilirsiniz.</h2><p className="my-3 text-body">Haber sayfasındaki “Daha sonra oku” düğmesiyle kendi listenizi oluşturun.</p><Link href="/son-haberler" className="text-brand-red">Son haberleri keşfet →</Link></div> : <ul className="divide-y divide-line dark:divide-line-dark">{items.map(item => <li key={item.slug} className="flex items-start justify-between gap-5 py-5"><Link href={`/haber/${item.slug}`} className="font-serif text-headline-m hover:text-brand-red">{item.title}</Link><button type="button" onClick={() => remove(item.slug)} aria-label={`${item.title} haberini listeden kaldır`} className="shrink-0 text-caption underline">Kaldır</button></li>)}</ul>}</div>;
}
