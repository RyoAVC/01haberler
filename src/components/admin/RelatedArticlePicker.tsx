"use client";
import { useState } from "react";
type Article = { id: string; title: string };
export function RelatedArticlePicker({ articles, initialIds }: { articles: Article[]; initialIds: string[] }) {
  const [selected, setSelected] = useState(() => [...new Set(initialIds)]);
  const [query, setQuery] = useState("");
  const matches = articles.filter(a => a.title.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")) && !selected.includes(a.id)).slice(0, 20);
  function move(index: number, direction: number) { setSelected(old => { const next = [...old], target = index + direction; if (target < 0 || target >= next.length) return old; [next[index], next[target]] = [next[target]!, next[index]!]; return next; }); }
  return <section className="space-y-3" aria-label="İlgili haber seçimi">
    <h3 className="font-serif text-headline-m">İlgili haberler</h3>
    <input type="hidden" name="articleIds" value={selected.join("\n")} />
    <p className="text-caption">{selected.length}/100 haber seçili. Seçim sırası dosyanın yayın sırasıdır. Değişiklikler dosyayla birlikte kaydedilir.</p>
    <ol className="space-y-2" aria-label="Seçilen haberler">{selected.map((id, i) => <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line-dark p-3"><span className="min-w-0 break-words">{i + 1}. {articles.find(a => a.id === id)?.title ?? "Haber artık yayında değil — kaydetmeden önce kaldırın"}</span><div className="flex flex-wrap gap-2"><button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30" aria-label={`${i + 1}. haberi yukarı taşı`}>Yukarı</button><button type="button" disabled={i === selected.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30" aria-label={`${i + 1}. haberi aşağı taşı`}>Aşağı</button><button type="button" onClick={() => setSelected(old => old.filter(value => value !== id))} aria-label={`${i + 1}. haberi seçimden kaldır`}>Kaldır</button></div></li>)}</ol>
    <label>Yayındaki haberlerde ara<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Haber başlığı" /></label>
    <p className="text-caption">Son 150 haber ve mevcut seçimlerde arar; ilk 20 eşleşme gösterilir.</p>
    <ul className="max-h-72 space-y-2 overflow-y-auto" aria-label="Haber arama sonuçları">{matches.map(a => <li key={a.id} className="flex items-start justify-between gap-3 rounded border border-line-dark p-3"><span className="min-w-0 break-words">{a.title}</span><button type="button" disabled={selected.length >= 100} className="shrink-0 underline disabled:opacity-30" onClick={() => setSelected(old => old.includes(a.id) || old.length >= 100 ? old : [...old, a.id])} aria-label={`${a.title} haberini ekle`}>Ekle</button></li>)}</ul>
    {!matches.length && <p className="text-caption">Eklenebilecek eşleşme bulunamadı.</p>}
  </section>;
}
