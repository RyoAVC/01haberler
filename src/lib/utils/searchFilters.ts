export type SearchSort = "newest" | "oldest" | "popular";
export interface SearchFilters { category?: string; from?: string; to?: string; sort?: SearchSort }
export type SearchParams = Record<string, string | string[] | undefined>;

function dateIsValid(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseSearchFilters(params: SearchParams) {
  const read = (key: string) => typeof params[key] === "string" ? (params[key] as string).trim() : "";
  const query = read("q").slice(0, 200);
  const category = read("kategori").slice(0, 100);
  const from = read("baslangic");
  const to = read("bitis");
  const requestedSort = read("sirala");
  const sort: SearchSort = requestedSort === "oldest" || requestedSort === "popular" ? requestedSort : "newest";
  const parsedPage = Number(read("sayfa") || "1");
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 100000 ? parsedPage : 1;
  const error = (from && !dateIsValid(from)) || (to && !dateIsValid(to))
    ? "Geçerli bir tarih girin."
    : from && to && from > to ? "Başlangıç tarihi bitiş tarihinden sonra olamaz." : null;
  return { query, category, from, to, sort, page, error };
}

export function searchDateRange(from?: string, to?: string) {
  const start = from ? new Date(`${from}T00:00:00+03:00`) : undefined;
  const end = to ? new Date(new Date(`${to}T00:00:00+03:00`).getTime() + 86400000) : undefined;
  return { start, end };
}

export function searchBasePath(filters: ReturnType<typeof parseSearchFilters>): string {
  const params = new URLSearchParams();
  const entries: [string, string][] = [["q", filters.query], ["kategori", filters.category], ["baslangic", filters.from], ["bitis", filters.to], ["sirala", filters.sort]];
  for (const [key, value] of entries) if (value) params.set(key, value);
  return `/arama?${params.toString()}`;
}
