"use client";
import { useEffect, useState } from "react";
import { parseEditorDraft, type EditorTextDraft, type StoredEditorDraft } from "@/lib/utils/editorDraft";
export function EditorDraftRecovery({ storageKey, value, baseline, onRestore, paused = false }: { storageKey: string; value: EditorTextDraft; baseline: EditorTextDraft; onRestore: (value: EditorTextDraft) => void; paused?: boolean }) {
  const [candidate, setCandidate] = useState<StoredEditorDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const serialized = JSON.stringify(value);
  const initial = JSON.stringify(baseline);
  useEffect(() => {
    try { const stored = parseEditorDraft(sessionStorage.getItem(storageKey)); if (stored && JSON.stringify(stored.value) !== initial) setCandidate(stored); }
    catch { setStatus("Bu tarayıcıda geçici metin kopyası saklanamıyor."); }
    setReady(true);
  }, [storageKey, initial]);
  useEffect(() => {
    if (!ready || candidate || paused) return;
    const timer = setTimeout(() => {
      try {
        if (serialized === initial) { sessionStorage.removeItem(storageKey); setStatus(""); return; }
        sessionStorage.setItem(storageKey, JSON.stringify({ value: JSON.parse(serialized), savedAt: new Date().toISOString() }));
        setStatus("Metnin geçici kopyası bu sekmede saklandı.");
      } catch { setStatus("Geçici kopya saklanamadı. Metninizi ayrıca kopyalayın."); }
    }, 800);
    return () => clearTimeout(timer);
  }, [serialized, initial, ready, candidate, storageKey, paused]);
  return <section className="rounded-lg border border-line-dark p-4 text-caption" aria-label="Metin kurtarma"><p>Yazdığınız başlık, spot, gövde ve SEO metinleri bu sekmede geçici olarak saklanır. Sayfa yenilenirse geri alabilirsiniz; 24 saatten eski kopyalar kullanılmaz. Sunucuya kayıt için Kaydet’e basın.</p>
    {candidate && <div className="mt-3"><p>Bu sekmede tamamlanmamış bir metin var: <strong>{candidate.value.title || "Başlıksız"}</strong>. Sunucudaki sürüm değişmiş olabilir; geri aldıktan sonra karşılaştırın.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => { onRestore(candidate.value); setCandidate(null); }} className="rounded bg-brand-red px-3 py-2 text-white">Metni geri al</button><button type="button" onClick={() => { try { sessionStorage.removeItem(storageKey); } catch { /* unavailable */ } setCandidate(null); }} className="rounded border border-line-dark px-3 py-2">Sunucudaki metinle devam et</button></div></div>}
    {status && <p role="status" className="mt-2 text-ink-dark-secondary">{status}</p>}
  </section>;
}
