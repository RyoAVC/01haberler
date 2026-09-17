export interface FollowedItem { href: string; title: string }
export const FOLLOWING_KEY = "01haberler.following.v1";
export function parseFollowing(raw: string | null): FollowedItem[] {
  try { const values: unknown = JSON.parse(raw ?? "[]"); if (!Array.isArray(values)) return [];
    const seen = new Set<string>();
    return values.filter((v): v is FollowedItem => !!v && typeof v.title === "string" && v.title.length > 0 && v.title.length <= 200 && typeof v.href === "string" && /^\/(konu|yerel|canli|yazar)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.href) && !seen.has(v.href) && !!seen.add(v.href)).slice(0, 100);
  } catch { return []; }
}
