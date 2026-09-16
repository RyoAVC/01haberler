import { getCurrentWeather, weatherLabel, weatherIconKind } from "@/server/services/weatherService";
import { getCurrencyRates } from "@/server/services/currencyService";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { SunIcon, CloudIcon, CloudRainIcon, CloudSnowIcon, TrendUpIcon, TrendDownIcon } from "@/components/ui/Icons";

const WEATHER_ICONS = {
  sun: SunIcon,
  cloud: CloudIcon,
  rain: CloudRainIcon,
  snow: CloudSnowIcon,
};

function CurrencyChip({ label, value, changePct }: { label: string; value: number; changePct: number | null }) {
  const isUp = changePct !== null && changePct > 0;
  const isDown = changePct !== null && changePct < 0;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-ink-secondary dark:text-ink-dark-secondary">{label}</span>
      <span className="font-mono font-medium">{value.toFixed(2)}</span>
      {changePct !== null && (isUp || isDown) && (
        <span className={`inline-flex items-center ${isUp ? "text-brand-red" : "text-status-positive"}`}>
          {isUp ? <TrendUpIcon width={13} height={13} strokeWidth={2.25} /> : <TrendDownIcon width={13} height={13} strokeWidth={2.25} />}
          <span className="font-mono text-[0.7rem]">{Math.abs(changePct).toFixed(1)}%</span>
        </span>
      )}
    </span>
  );
}

export async function MarketWidget() {
  const [weatherEnabled, currencyEnabled] = await Promise.all([
    isModuleEnabled("weather"),
    isModuleEnabled("currency"),
  ]);
  if (!weatherEnabled && !currencyEnabled) return null;

  const [weather, rates] = await Promise.all([
    weatherEnabled ? getCurrentWeather() : Promise.resolve(null),
    currencyEnabled ? getCurrencyRates() : Promise.resolve(null),
  ]);

  if (!weather && !rates) return null;

  const WeatherIcon = weather ? WEATHER_ICONS[weatherIconKind(weather.weatherCode)] : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption font-medium text-ink dark:text-ink-dark">
      {weather && WeatherIcon && (
        <span className="inline-flex items-center gap-1.5">
          <WeatherIcon width={15} height={15} className="text-ink-secondary dark:text-ink-dark-secondary" />
          <span className="font-mono">{weather.temperatureC}°C</span>
          <span className="text-ink-secondary dark:text-ink-dark-secondary">{weather.city} · {weatherLabel(weather.weatherCode)}</span>
        </span>
      )}
      {weather && rates && <span className="hidden h-3 w-px bg-line dark:bg-line-dark sm:inline-block" aria-hidden />}
      {rates && (
        <span className="inline-flex items-center gap-3">
          <CurrencyChip label="USD" value={rates.usdTry} changePct={rates.usdTryChangePct} />
          <CurrencyChip label="EUR" value={rates.eurTry} changePct={rates.eurTryChangePct} />
        </span>
      )}
    </div>
  );
}
