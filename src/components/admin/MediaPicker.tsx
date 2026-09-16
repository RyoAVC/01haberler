"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
export interface LibraryMedia { id: string; url: string; altText: string | null; originalFilename: string | null; source: string }
export function MediaPicker({ onSelect }: { onSelect: (media: LibraryMedia) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LibraryMedia[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}&page=${page}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json(); setItems(data.items); setHasMore(data.hasMore);
      } catch { if (!controller.signal.aborted) { setItems([]); setError("Medya listesi alınamadı. Yeniden açarak deneyin."); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query, page]);
  return <div className="mt-3"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded border border-line-dark px-4 py-2 text-caption">{open ? "Medya seçiciyi kapat" : "Medya kütüphanesinden seç"}</button>
    {open && <section aria-label="Medya seçici" className="mt-3 rounded-lg border border-line-dark p-4">
      <label className="block text-caption">Dosya adı veya alternatif metinle ara<input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} maxLength={100} className="mt-2 block w-full border border-line-dark bg-transparent p-2" /></label>
      {loading && <p role="status" className="mt-3 text-caption">Görseller yükleniyor…</p>}{error && <p role="alert">{error}</p>}
      {!loading && !error && !items.length && <p className="mt-3 text-caption">Eşleşen görsel bulunamadı.</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{!loading && items.map(media => <button type="button" key={media.id} onClick={() => { onSelect(media); setOpen(false); }} className="overflow-hidden rounded border border-line-dark text-left hover:border-brand-red"><Image src={media.url} alt={media.altText ?? ""} width={200} height={120} unoptimized className="h-28 w-full object-cover" /><span className="block truncate p-2 text-caption">{media.originalFilename || media.altText || "Kaynak görseli"}</span></button>)}</div>
      <div className="mt-4 flex items-center justify-between text-caption"><button type="button" disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="disabled:opacity-40">← Önceki</button><span>Sayfa {page}</span><button type="button" disabled={!hasMore || loading} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Sonraki →</button></div>
    </section>}
  </div>;
}
