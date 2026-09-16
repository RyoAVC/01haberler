const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;
const API_BASE = "https://www.thesportsdb.com/api/v1/json/3";

export const FIXTURE_LEAGUES = [
  { id: "4339", name: "Süper Lig" },
  { id: "4335", name: "LaLiga" },
  { id: "4328", name: "Premier Lig" },
  { id: "4331", name: "Bundesliga" },
  { id: "4332", name: "Serie A" },
  { id: "4480", name: "Şampiyonlar Ligi" },
] as const;

export interface FixtureMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge: string | null;
  awayBadge: string | null;
  dateLabel: string;
  timeLabel: string | null;
}

export interface LeagueFixtures {
  leagueId: string;
  leagueName: string;
  leagueBadge: string | null;
  matches: FixtureMatch[];
}

interface RawEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  strLeagueBadge: string | null;
  dateEvent: string | null;
  strTime: string | null;
  intRound: string | null;
  strSeason: string | null;
}

async function fetchJson(url: string): Promise<{ events: RawEvent[] | null } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`TheSportsDB HTTP ${res.status}`);
    return (await res.json()) as { events: RawEvent[] | null };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function kickoffMs(event: RawEvent): number | null {
  if (!event.dateEvent) return null;
  const iso = `${event.dateEvent}T${event.strTime ?? "00:00:00"}Z`;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function toFixtureMatch(event: RawEvent): FixtureMatch {
  const ms = kickoffMs(event);
  const date = ms !== null ? new Date(ms) : null;

  return {
    id: event.idEvent,
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    homeBadge: event.strHomeTeamBadge,
    awayBadge: event.strAwayTeamBadge,
    dateLabel: date
      ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "short", weekday: "short" }).format(date)
      : "Tarih belirlenmedi",
    timeLabel:
      date && event.strTime
        ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }).format(date)
        : null,
  };
}

async function fetchLeagueFixtures(leagueId: string, leagueName: string): Promise<LeagueFixtures> {
  const empty: LeagueFixtures = { leagueId, leagueName, leagueBadge: null, matches: [] };

  const next = await fetchJson(`${API_BASE}/eventsnextleague.php?id=${leagueId}`);
  const nextEvent = next?.events?.[0];
  if (!nextEvent?.intRound || !nextEvent?.strSeason) return empty;

  const round = await fetchJson(`${API_BASE}/eventsround.php?id=${leagueId}&r=${nextEvent.intRound}&s=${nextEvent.strSeason}`);
  const events = round?.events ?? [];
  const now = Date.now();

  // TheSportsDB'nin ucretsiz veri setinde "eventsround" sonucu, "eventsnextleague"
  // tarafindan bildirilen bir sonraki maci icermeyebiliyor (round numarasi
  // eslesse bile) - bu yuzden nextEvent'i dogrulanmis bir mac olarak her zaman
  // listeye dahil ediyoruz (ayni id varsa tekrar eklenmez).
  const byId = new Map<string, RawEvent>();
  for (const e of events) byId.set(e.idEvent, e);
  byId.set(nextEvent.idEvent, nextEvent);

  const matches = [...byId.values()]
    .map((e) => ({ event: e, ms: kickoffMs(e) }))
    .filter((e) => e.ms !== null && e.ms >= now)
    .sort((a, b) => (a.ms as number) - (b.ms as number))
    .map((e) => toFixtureMatch(e.event));

  return { leagueId, leagueName, leagueBadge: nextEvent.strLeagueBadge, matches };
}

let cache: { fetchedAt: number; data: LeagueFixtures[] } | null = null;

/**
 * Her ligin bir sonraki (henuz oynanmamis) turunun tum maclarini getirir.
 * TheSportsDB'nin ucretsiz test anahtari kullanilir; herhangi bir cagri
 * basarisiz olursa o lig bos donduruler, tum akis asla patlamaz.
 */
export async function getWeeklyFixtures(): Promise<LeagueFixtures[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const data = await Promise.all(FIXTURE_LEAGUES.map((l) => fetchLeagueFixtures(l.id, l.name)));
    cache = { fetchedAt: Date.now(), data };
    return data;
  } catch {
    return cache?.data ?? FIXTURE_LEAGUES.map((l) => ({ leagueId: l.id, leagueName: l.name, leagueBadge: null, matches: [] }));
  }
}
