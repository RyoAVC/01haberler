"use client";
import Image from "next/image";
import { useState } from "react";
import { mediaFocus } from "@/lib/utils/mediaFocus";

export function MediaFocusPicker({ url, initial }: { url: string; initial: { focusX?: number; focusY?: number } | undefined }) {
  const [focus, setFocus] = useState(() => mediaFocus(initial));
  const [failed, setFailed] = useState(false);
  const position = `${focus.x}% ${focus.y}%`;
  return <section className="space-y-3" aria-label="Görsel odak noktası">
    <p className="text-caption">Korunmasını istediğiniz noktaya tıklayın. Klavyeyle odak yüzdelerini değiştirebilirsiniz.</p>
    <button type="button" disabled={failed} aria-label="Görsel üzerinde odak seç" className="relative block w-full overflow-hidden rounded-lg border border-line-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red" onClick={event => {
      if (event.detail === 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setFocus({ x: Math.round(Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100))), y: Math.round(Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100))) });
    }}>
      <Image src={url} alt="Odak seçilecek görsel" width={600} height={400} unoptimized onError={() => setFailed(true)} className="block h-auto w-full" />
      {!failed && <span aria-hidden="true" className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-red shadow" style={{ left: `${focus.x}%`, top: `${focus.y}%` }} />}
    </button>
    {failed && <p role="alert" className="text-caption">Görsel yüklenemedi. Odak yüzdelerini elle düzenleyebilirsiniz.</p>}
    <div className="grid grid-cols-2 gap-3">{(["x", "y"] as const).map(axis => <label key={axis} className="min-w-0 text-caption">Odak {axis.toUpperCase()} (0–100)<input type="number" name={`focus${axis.toUpperCase()}`} min={0} max={100} step={1} required value={focus[axis]} onChange={event => { const value = event.currentTarget.valueAsNumber; if (Number.isFinite(value)) setFocus(old => ({ ...old, [axis]: Math.max(0, Math.min(100, value)) })); }} className="mt-1 block w-full min-w-0 border border-line-dark bg-transparent p-2" /></label>)}</div>
    <button type="button" onClick={() => setFocus({ x: 50, y: 50 })} className="text-caption underline">Merkeze al</button>
    <div className="grid grid-cols-2 gap-3" role="group" aria-label="Kırpma önizlemeleri">{[{ label: "Geniş ekran · 16:9", ratio: "16 / 9" }, { label: "Mobil · 4:5", ratio: "4 / 5" }].map(item => <figure key={item.label} className="min-w-0"><div className="relative overflow-hidden rounded border border-line-dark" style={{ aspectRatio: item.ratio }}><Image src={url} alt="" fill unoptimized className="object-cover" style={{ objectPosition: position }} /></div><figcaption className="mt-1 text-caption">{item.label}</figcaption></figure>)}</div>
    <p className="text-caption">Önizleme örnek kırpma oranlarını gösterir. Odak ana sayfa manşetlerinde uygulanır; özgün dosya değişmez. Kaydettiğinizde aynı görseli kullanan manşetler etkilenir.</p>
  </section>;
}
