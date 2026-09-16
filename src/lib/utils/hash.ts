import { createHash } from "node:crypto";

export function normalizeForHash(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentHash(title: string, body: string): string {
  return createHash("sha256").update(normalizeForHash(title + " " + body)).digest("hex");
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function canonicalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"];
  for (const param of trackingParams) {
    url.searchParams.delete(param);
  }
  url.searchParams.sort();
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}
