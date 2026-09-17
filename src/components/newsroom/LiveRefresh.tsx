"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ active, latestAt }: { active: boolean; latestAt: string }) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!active || paused || pending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) startTransition(() => router.refresh());
    }, 30000);
    return () => window.clearInterval(timer);
  }, [active, paused, pending, router]);
  return <div className="module-card mb-5 flex flex-wrap items-center justify-between gap-3" aria-label="Canlı akış kontrolleri">
    <div><p className="text-caption">{active ? paused ? "Otomatik yenileme duraklatıldı." : "Bu sayfa açıkken 30 saniyede bir yenilenir." : "Arşiv görünümü · otomatik yenileme kapalı."}</p><p className="mt-1 text-caption">Son içerik güncellemesi: <time dateTime={latestAt}>{new Date(latestAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</time> (TSİ)</p></div>
    <div className="flex flex-wrap gap-3">{active && <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} className="rounded border border-line px-3 py-2 text-caption dark:border-line-dark">{paused ? "Otomatik yenilemeyi sürdür" : "Otomatik yenilemeyi duraklat"}</button>}<button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="rounded border border-line px-3 py-2 text-caption disabled:opacity-50 dark:border-line-dark">{pending ? "Yenileniyor…" : "Şimdi yenile"}</button></div>
  </div>;
}
