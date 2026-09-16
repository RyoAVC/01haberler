import { getCurrencyRates } from "./currencyService";
export interface GoldQuote { price: number; updatedAt: string; stale: boolean }
export interface MarketSnapshot { rates: Awaited<ReturnType<typeof getCurrencyRates>>; gold: GoldQuote | null; checkedAt: string }
let saved: GoldQuote | null = null;
let checked = 0;
let pending: Promise<GoldQuote | null> | null = null;

export function parseGoldQuote(data: unknown, now = Date.now()): GoldQuote | null {
  const d = data as { symbol?: string; currency?: string; price?: number; updatedAt?: string } | null;
  if (!d || d.symbol !== "XAU" || (d.currency && d.currency !== "USD") || typeof d.price !== "number" || !Number.isFinite(d.price) || d.price <= 0 || !d.updatedAt) return null;
  const timestamp = Date.parse(d.updatedAt);
  if (!Number.isFinite(timestamp) || timestamp > now + 300000) return null;
  return { price: d.price, updatedAt: d.updatedAt, stale: now - timestamp > 15 * 60000 };
}
async function getGold(): Promise<GoldQuote | null> {
  if (pending) return pending;
  if (Date.now() - checked < 60000) return saved;
  checked = Date.now();
  pending = (async () => {
    try {
      const response = await fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(4500), next: { revalidate: 60 } });
      if (!response.ok) throw new Error("Altın servisi kullanılamıyor");
      const quote = parseGoldQuote(await response.json());
      if (!quote) throw new Error("Geçersiz altın verisi");
      saved = quote;
    } catch { if (saved) saved = { ...saved, stale: true }; }
    return saved;
  })().finally(() => { pending = null; });
  return pending;
}
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const [rates, gold] = await Promise.all([getCurrencyRates(), getGold()]);
  return { rates, gold, checkedAt: new Date().toISOString() };
}
