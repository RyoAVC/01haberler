"use client";
import { useEffect, useState } from "react";
import { parseReadingList, READING_LIST_KEY } from "@/lib/utils/readingList";
export function SaveArticleButton({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => { try { setSaved(parseReadingList(localStorage.getItem(READING_LIST_KEY)).some(a => a.slug === slug)); } catch { /* Unavailable storage. */ } };
    sync(); window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, [slug]);
  function toggle() {
    try {
      const list = parseReadingList(localStorage.getItem(READING_LIST_KEY));
      const exists = list.some(a => a.slug === slug);
      const next = exists ? list.filter(a => a.slug !== slug) : [{ slug, title, savedAt: new Date().toISOString() }, ...list].slice(0, 100);
      localStorage.setItem(READING_LIST_KEY, JSON.stringify(next)); setSaved(!exists); setError("");
    } catch { setError("Bu tarayıcıda kayıt yapılamıyor."); }
  }
  return <div className="print:hidden"><button type="button" aria-pressed={saved} onClick={toggle} className="rounded-full border border-line px-4 py-2 text-caption hover:border-brand-red dark:border-line-dark">{saved ? "✓ Okuma listemde" : "+ Daha sonra oku"}</button>{error && <p role="alert" className="text-caption">{error}</p>}</div>;
}
