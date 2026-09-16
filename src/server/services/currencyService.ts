const CACHE_TTL_MS = 30 * 60 * 1000;
let inFlight: Promise<CurrencyRates | null> | null = null;
const REQUEST_TIMEOUT_MS = 6000;

export interface CurrencyRates {
  usdTry: number;
  eurTry: number;
  usdTryChangePct: number | null;
  eurTryChangePct: number | null;
  date: string;
  fetchedAt: string;
  stale: boolean;
}

let cache: { fetchedAt: number; rates: CurrencyRates | null } | null = null;

async function fetchWithTimeout(url: string): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), next: { revalidate: 1800 } });
}

async function fetchLatestPair(): Promise<{ usdTry: number; eurTry: number; date: string } | null> {
  const res = await fetchWithTimeout("https://api.frankfurter.app/latest?from=EUR&to=USD,TRY");
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = (await res.json()) as { date?: string; rates?: { USD?: number; TRY?: number } };
  const eurTry = data.rates?.TRY;
  const eurUsd = data.rates?.USD;
  if (typeof eurTry !== "number" || typeof eurUsd !== "number" || !Number.isFinite(eurTry) || !Number.isFinite(eurUsd) || eurTry <= 0 || eurUsd <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? "")) return null;
  return { usdTry: eurTry / eurUsd, eurTry, date: data.date! };
}

async function fetchPreviousBusinessDayPair(latestDate: string): Promise<{ usdTry: number; eurTry: number } | null> {
  // Provider resolves holidays to its latest available date before that day.
  for (let daysAgo = 1; daysAgo <= 1; daysAgo++) {
    const date = new Date(new Date(`${latestDate}T12:00:00Z`).getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isoDate = date.toISOString().slice(0, 10);
    try {
      const res = await fetchWithTimeout(`https://api.frankfurter.app/${isoDate}?from=EUR&to=USD,TRY`);
      if (!res.ok) continue;
      const data = (await res.json()) as { date?: string; rates?: { USD?: number; TRY?: number } };
      const eurTry = data.rates?.TRY;
      const eurUsd = data.rates?.USD;
      if (data.date && data.date < latestDate && typeof eurTry === "number" && typeof eurUsd === "number" && Number.isFinite(eurTry) && Number.isFinite(eurUsd) && eurTry > 0 && eurUsd > 0) {
        return { usdTry: eurTry / eurUsd, eurTry };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function changePct(current: number, previous: number | undefined): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// Frankfurter.app - ECB tabanli, ucretsiz/anahtarsiz doviz kuru API'si.
async function loadCurrencyRates(): Promise<CurrencyRates | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  try {
    const latest = await fetchLatestPair();
    if (!latest) throw new Error("Guncel kur alinamadi");
    const previous = await fetchPreviousBusinessDayPair(latest.date);

    const rates: CurrencyRates = {
      usdTry: latest.usdTry,
      eurTry: latest.eurTry,
      usdTryChangePct: changePct(latest.usdTry, previous?.usdTry),
      eurTryChangePct: changePct(latest.eurTry, previous?.eurTry),
      date: latest.date,
      fetchedAt: new Date().toISOString(),
      stale: false,
    };

    cache = { fetchedAt: Date.now(), rates };
    return rates;
  } catch {
    const rates = cache?.rates ? { ...cache.rates, stale: true } : null;
    cache = { fetchedAt: Date.now() - CACHE_TTL_MS + 60000, rates };
    return rates;
  }
}

export function getCurrencyRates(): Promise<CurrencyRates | null> {
  if (inFlight) return inFlight;
  inFlight = loadCurrencyRates().finally(() => { inFlight = null; });
  return inFlight;
}
