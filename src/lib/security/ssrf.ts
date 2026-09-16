import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === undefined || b === undefined) return true;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("fe80")) return true; // link-local
    return false;
  }
  return true;
}

export class UnsafeUrlError extends Error {}

/**
 * Kaynak/RSS URL'leri panelden eklenirken SSRF onlemi: ozel IP, localhost
 * ve bulut metadata endpoint'lerine cikan adresleri reddeder.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Gecersiz URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Yalnizca http/https URL kabul edilir");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new UnsafeUrlError("Bu adrese erisim engellendi");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new UnsafeUrlError("Ozel/dahili IP adreslerine erisim engellendi");
    }
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new UnsafeUrlError("Bu alan adi dahili bir IP adresine cozumleniyor, engellendi");
    }
  }

  return url;
}
