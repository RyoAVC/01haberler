"use client";
import { useEffect, useState } from "react";
import type { MarketSnapshot } from "@/server/services/marketService";
const money = (value: number | undefined) => value === undefined ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
export function MarketBoard({ initial }: { initial: MarketSnapshot }) {
  const [data, setData] = useState(initial);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const refresh = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const res = await fetch("/api/markets", { signal: controller.signal });
        if (!res.ok) throw new Error();
        const next = await res.json();
        if (!next.checkedAt) throw new Error();
        setData(next); setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { busy = false; }
    };
    const timer = setInterval(refresh, 60000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  const { rates, gold } = data;
  const gram = gold && rates ? gold.price * rates.usdTry / 31.1034768 : undefined;
  const quotes = [
    { label: "Dolar", code: "USD / TRY", value: rates?.usdTry, change: rates?.usdTryChangePct, note: "Günlük referans" },
    { label: "Euro", code: "EUR / TRY", value: rates?.eurTry, change: rates?.eurTryChangePct, note: "Günlük referans" },
    { label: "Gram altın", code: "24 AYAR · TL", value: gram, change: null, note: "Hesaplanan gösterge" },
    { label: "Ons altın", code: "XAU / USD", value: gold?.price, change: null, note: gold?.stale ? "Son alınan veri" : "Sağlayıcı fiyatı" },
  ];
  return <section aria-label="Piyasa özeti" className="market-board market-compact">
    <div className="market-board-title"><span className="eyebrow">PİYASA RADARI</span><span className="market-update-indicator"><i aria-hidden="true" />60 sn kontrol</span></div>
    <div className="market-quotes">{quotes.map(q => <div key={q.label} className="market-quote">
      <div className="flex items-center justify-between gap-2"><h3>{q.label}</h3><span className="text-[10px] tracking-wide text-ink-secondary dark:text-ink-dark-secondary">{q.code}</span></div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2"><strong className="market-value font-semibold tabular-nums tracking-tight">{money(q.value)}</strong>{q.change != null && <span className={`text-xs tabular-nums ${q.change >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-brand-red"}`}>{q.change > 0 ? "+" : ""}{q.change.toFixed(2)}%</span>}</div>
      <p className="market-note text-ink-secondary dark:text-ink-dark-secondary">{q.value === undefined ? "Veri alınamadı" : q.note}</p>
    </div>)}</div>
    <p className="px-4 pb-3 text-[10px] text-ink-secondary dark:text-ink-dark-secondary">Kur tarihi: {rates?.date ?? "veri yok"} · Altın: {gold ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(gold.updatedAt)) : "veri yok"} (TSİ){failed || rates?.stale || gold?.stale ? " · Güncelleme gecikmiş olabilir" : ""}</p>
    <details className="market-details"><summary>Kaynaklar ve güncelleme bilgisi{failed || rates?.stale || gold?.stale ? " · Son alınan veriler gösteriliyor" : ""}</summary>
      <p className="mt-2">Döviz: <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a>, veri tarihi {rates?.date ?? "bilinmiyor"}. Referans kurlar günlüktür; anlık alış/satış fiyatı değildir.</p>
      <p>Altın: <a href="https://gold-api.com/" target="_blank" rel="noreferrer">Gold API</a>, {gold ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(gold.updatedAt)) : "veri yok"} (Türkiye). Görünür sayfada 60 saniyede bir kontrol edilir.</p>
      <p>Gram altın = ons fiyatı × günlük USD/TRY ÷ 31,1034768. Farklı zamanlı verilerle hesaplanan göstergedir; kuyumcu alış/satış fiyatı değildir.</p>
    </details>
  </section>;
}
