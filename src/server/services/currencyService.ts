const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;

export interface CurrencyRates {
  usdTry: number;
  eurTry: number;
  usdTryChangePct: number | null;
  eurTryChangePct: number | null;
}

let cache: { fetchedAt: number; rates: CurrencyRates | null } | null = null;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLatestPair(): Promise<{ usdTry: number; eurTry: number } | null> {
  const res = await fetchWithTimeout("https://api.frankfurter.app/latest?from=EUR&to=USD,TRY");
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = (await res.json()) as { rates?: { USD?: number; TRY?: number } };
  const eurTry = data.rates?.TRY;
  const eurUsd = data.rates?.USD;
  if (typeof eurTry !== "number" || typeof eurUsd !== "number") return null;
  return { usdTry: eurTry / eurUsd, eurTry };
}

async function fetchPreviousBusinessDayPair(): Promise<{ usdTry: number; eurTry: number } | null> {
  // Hafta sonu/tatil gunlerinde Frankfurter o gunun kaydini tutmuyor,
  // bulunana kadar birkac gun geriye gidilir (ECB verisi ayni sekilde davranir).
  for (let daysAgo = 1; daysAgo <= 4; daysAgo++) {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const isoDate = date.toISOString().slice(0, 10);
    try {
      const res = await fetchWithTimeout(`https://api.frankfurter.app/${isoDate}?from=EUR&to=USD,TRY`);
      if (!res.ok) continue;
      const data = (await res.json()) as { rates?: { USD?: number; TRY?: number } };
      const eurTry = data.rates?.TRY;
      const eurUsd = data.rates?.USD;
      if (typeof eurTry === "number" && typeof eurUsd === "number") {
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
export async function getCurrencyRates(): Promise<CurrencyRates | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  try {
    const [latest, previous] = await Promise.all([fetchLatestPair(), fetchPreviousBusinessDayPair()]);
    if (!latest) throw new Error("Guncel kur alinamadi");

    const rates: CurrencyRates = {
      usdTry: latest.usdTry,
      eurTry: latest.eurTry,
      usdTryChangePct: changePct(latest.usdTry, previous?.usdTry),
      eurTryChangePct: changePct(latest.eurTry, previous?.eurTry),
    };

    cache = { fetchedAt: Date.now(), rates };
    return rates;
  } catch {
    return cache?.rates ?? null;
  }
}
