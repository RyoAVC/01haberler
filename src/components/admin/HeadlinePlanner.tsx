"use client";
import { useState } from "react";
import Image from "next/image";
import type { HomeSettings } from "@/server/services/homeSettingsService";
import { formatPublicationSchedule } from "@/lib/utils/publicationSchedule";
import { activeHeadlineIds, headlineWindow } from "@/lib/utils/headlineSchedule";
import { selectPinnedHeadlines } from "@/lib/utils/headlines";

type Option = { id: string; title: string; slug: string; coverMedia: { url: string } | null };
type Drag = { slot: number } | { article: string };
const names = ["primary", "secondary1", "secondary2"];
const labels = ["Birincil manşet", "İkincil manşet 1", "İkincil manşet 2"];
export function HeadlinePlanner({ settings, articles }: { settings: HomeSettings; articles: Option[] }) {
  const [slots, setSlots] = useState([0, 1, 2].map(i => ({ id: settings.headlineIds[i] ?? "", start: settings.windows?.[i]?.startAt ? formatPublicationSchedule(new Date(settings.windows[i]!.startAt!)) : "", end: settings.windows?.[i]?.endAt ? formatPublicationSchedule(new Date(settings.windows[i]!.endAt!)) : "" })));
  const [dragging, setDragging] = useState<Drag | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [previewAt, setPreviewAt] = useState("");
  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from > 2 || to > 2) return;
    setSlots(old => { const next = [...old]; [next[from], next[to]] = [next[to]!, next[from]!]; return next; });
    setNotice(`${labels[from]} ve ${labels[to]} zamanlarıyla birlikte yer değiştirdi.`);
  }
  function assign(index: number, id: string) {
    if (id && slots.some((s, i) => i !== index && s.id === id)) { setNotice("Bu haber başka bir manşette seçili. Yerini değiştirmek için manşet kartlarını taşıyın."); return; }
    setSlots(old => old.map((s, i) => i === index ? { ...s, id } : s));
    setNotice(`${labels[index]} seçimi güncellendi. Kaydetmeyi unutmayın.`);
  }
  let previewError = "";
  let preview: Option[] = [];
  try {
    const windows = slots.map(s => headlineWindow(s.start, s.end));
    const at = previewAt ? Date.parse(headlineWindow(previewAt, "").startAt!) : Date.now();
    preview = selectPinnedHeadlines(activeHeadlineIds(slots.map(s => s.id), windows, at), articles, articles);
  } catch (error) { previewError = error instanceof Error ? error.message : "Tarihleri kontrol edin."; }
  const matches = articles.filter(a => a.title.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))).slice(0, 24);
  return <div className="space-y-6">
    <p className="text-caption">Haber havuzundan bir haberi manşet alanına sürükleyin veya alanın Haber menüsünü kullanın. Kartlar taşındığında zamanları da taşınır. Tüm tarihler Türkiye saatidir (UTC+3).</p>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className="min-w-0 rounded-xl border border-line-dark p-4" aria-label="Haber havuzu">
        <h2 className="font-serif text-headline-m">Haber havuzu</h2>
        <label className="mt-3 block text-caption">Haber ara<input type="search" value={query} onChange={e => setQuery(e.target.value)} className="mt-2 block w-full rounded border border-line-dark bg-transparent p-3" /></label>
        <p className="my-3 text-caption">En yeni 200 haber ve mevcut seçimler. İlk 24 eşleşme gösterilir.</p>
        <div className="max-h-[560px] space-y-2 overflow-y-auto">{matches.map(a => <article key={a.id} draggable onDragStart={e => { e.dataTransfer.setData("text/plain", a.id); e.dataTransfer.effectAllowed = "copy"; setDragging({ article: a.id }); }} onDragEnd={() => setDragging(null)} className="cursor-grab rounded-lg border border-line-dark p-3" aria-label={`Sürükle: ${a.title}`}><p className="text-caption">{a.title}</p><div className="mt-2 flex flex-wrap gap-2">{labels.map((label, i) => <button key={label} type="button" onClick={() => assign(i, a.id)} className="rounded border border-line-dark px-2 py-1 text-caption" aria-label={`${a.title} haberini ${label} alanına yerleştir`}>{i === 0 ? "Birincil" : `İkincil ${i}`}</button>)}</div></article>)}{!matches.length && <p>Aramanızla eşleşen haber yok.</p>}</div>
      </section>
      <div className="min-w-0 space-y-4">{slots.map((slot, i) => <section key={i} aria-label={labels[i]} className="min-w-0 rounded-xl border border-line-dark p-4" onDragOver={e => { if (dragging) e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (dragging && "slot" in dragging) move(dragging.slot, i); else if (dragging && "article" in dragging) assign(i, dragging.article); setDragging(null); }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{labels[i]}</h2><div className="flex gap-3"><button type="button" draggable onDragStart={e => { e.dataTransfer.setData("text/plain", String(i)); setDragging({ slot: i }); }} onDragEnd={() => setDragging(null)} aria-label={`${labels[i]} kartını sürükle`}>↕ Taşı</button><button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="disabled:opacity-30" aria-label={`${labels[i]} yukarı taşı`}>Yukarı</button><button type="button" disabled={i === 2} onClick={() => move(i, i + 1)} className="disabled:opacity-30" aria-label={`${labels[i]} aşağı taşı`}>Aşağı</button></div></div>
        <label className="block text-caption">Haber<select name={names[i]} value={slot.id} onChange={e => assign(i, e.target.value)} className="mt-2 block w-full min-w-0 rounded border border-line-dark bg-surface-dark p-3"><option value="">Otomatik — en yeni haber</option>{articles.map(a => <option key={a.id} value={a.id} disabled={slots.some((s, j) => j !== i && s.id === a.id)}>{a.title}</option>)}{slot.id && !articles.some(a => a.id === slot.id) && <option value={slot.id}>Yayında olmayan haber — otomatik alternatif gösterilir</option>}</select></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{(["start", "end"] as const).map(field => <label key={field} className="min-w-0 text-caption">{field === "start" ? "Başlangıç" : "Bitiş"}<input type="datetime-local" name={`${field}${i}`} value={slot[field]} onChange={e => setSlots(old => old.map((s, j) => j === i ? { ...s, [field]: e.target.value } : s))} className="mt-1 block w-full min-w-0 border border-line-dark bg-transparent p-2" /></label>)}</div>
      </section>)}</div>
    </div>
    <p role="status" className="text-caption" aria-live="polite">{notice}</p>
    <section className="rounded-xl border border-line-dark p-4" aria-label="Manşet önizlemesi">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-headline-m">Manşet önizlemesi</h2><div className="flex gap-2"><button type="button" aria-pressed={view === "desktop"} onClick={() => setView("desktop")} className="rounded border border-line-dark px-3 py-2">Masaüstü</button><button type="button" aria-pressed={view === "mobile"} onClick={() => setView("mobile")} className="rounded border border-line-dark px-3 py-2">Mobil</button></div></div>
      <label className="my-4 block max-w-sm text-caption">Önizleme zamanı (boşsa şimdi)<input type="datetime-local" value={previewAt} onChange={e => setPreviewAt(e.target.value)} className="mt-1 block w-full min-w-0 border border-line-dark bg-transparent p-2" /></label>
      {previewError ? <p role="alert" className="text-brand-red">{previewError}</p> : <div data-testid="headline-preview" data-view={view} className={view === "mobile" ? "mx-auto max-w-[390px] space-y-3" : "grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-3"}>{preview.map((a, i) => <article key={a.id} className={`min-w-0 overflow-hidden rounded-lg border border-line-dark ${view === "desktop" && i === 0 ? "row-span-2" : ""}`}>{a.coverMedia && <Image src={a.coverMedia.url} alt="" width={600} height={300} unoptimized className={`w-full object-cover ${view === "desktop" && i > 0 ? "h-20" : "h-40"}`} />}<div className="p-3"><span className="text-caption">{labels[i]}</span><p className="mt-2 break-words font-serif">{a.title}</p></div></article>)}</div>}
      {!preview.length && !previewError && <p>Önizleme için yayında haber bulunmuyor.</p>}
      <p className="mt-3 text-caption">Kaydedilmemiş seçimleri gösterir. Başlangıçtan önce ve bitiş anından itibaren en yeni uygun haber seçilir. Otomatik geçiş sonraki ana sayfa isteğinde uygulanır. Aynı haber manşet grubunda yalnızca bir kez görünür.</p>
    </section>
  </div>;
}
