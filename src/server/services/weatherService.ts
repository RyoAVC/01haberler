const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;

// Ankara koordinatlari - varsayilan sehir. Open-Meteo anahtarsiz/ucretsiz.
const DEFAULT_LAT = 39.93;
const DEFAULT_LON = 32.86;
const DEFAULT_CITY = "Ankara";

export interface WeatherInfo {
  city: string;
  temperatureC: number;
  weatherCode: number;
}

const WEATHER_CODE_LABEL: Record<number, string> = {
  0: "Açık",
  1: "Az bulutlu",
  2: "Parçalı bulutlu",
  3: "Kapalı",
  45: "Sisli",
  48: "Sisli",
  51: "Çisenti",
  61: "Yağmurlu",
  63: "Yağmurlu",
  65: "Sağanak",
  71: "Karlı",
  73: "Karlı",
  75: "Yoğun kar",
  80: "Sağanak",
  95: "Fırtınalı",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODE_LABEL[code] ?? "Değişken";
}

export type WeatherIconKind = "sun" | "cloud" | "rain" | "snow";

export function weatherIconKind(code: number): WeatherIconKind {
  if (code === 0 || code === 1) return "sun";
  if ([71, 73, 75].includes(code)) return "snow";
  if ([51, 61, 63, 65, 80, 95].includes(code)) return "rain";
  return "cloud";
}

let cache: { fetchedAt: number; info: WeatherInfo | null } | null = null;

export async function getCurrentWeather(): Promise<WeatherInfo | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.info;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current=temperature_2m,weather_code`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };

    const info: WeatherInfo | null =
      typeof data.current?.temperature_2m === "number"
        ? {
            city: DEFAULT_CITY,
            temperatureC: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code ?? 0,
          }
        : null;

    cache = { fetchedAt: Date.now(), info };
    return info;
  } catch {
    return cache?.info ?? null;
  } finally {
    clearTimeout(timeout);
  }
}
