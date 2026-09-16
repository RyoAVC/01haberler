"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CONSENT_COOKIE_NAME } from "@/lib/consent/types";
import type { ActiveAd } from "@/server/services/adService";

function hasAdConsent(): boolean {
  const match = document.cookie.match(new RegExp(`${CONSENT_COOKIE_NAME}=([^;]+)`));
  if (!match || !match[1]) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return Boolean(parsed.ads);
  } catch {
    return false;
  }
}

let adsenseScriptLoaded = false;

function loadAdsenseScript(publisherId: string) {
  if (adsenseScriptLoaded) return;
  adsenseScriptLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

interface AdUnitProps {
  ad: ActiveAd;
  adsenseEnabled: boolean;
  publisherId: string;
  eager?: boolean;
}

/**
 * Reklam alani her zaman sabit yukseklikle ayrilir (CLS onlemi). Gercek
 * reklam icerigi yalnizca kullanici onayi verildiginde ve alan gorunur
 * hale geldiginde (ilk katlanti disi ise hemen) yuklenir; otomatik
 * yenileme veya tiklama tesviki yoktur.
 */
export function AdUnit({ ad, adsenseEnabled, publisherId, eager = false }: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [consented, setConsented] = useState(false);
  const impressionSent = useRef(false);

  useEffect(() => {
    setConsented(hasAdConsent());
    if (eager) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!visible || impressionSent.current) return;
    impressionSent.current = true;
    navigator.sendBeacon?.(`/api/ads/${ad.id}/impression`);
    if (ad.provider === "ADSENSE" && adsenseEnabled && publisherId && consented) {
      loadAdsenseScript(publisherId);
      try {
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || [];
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
      } catch {
        // adsense script henuz hazir degil; sonraki render'da tekrar denenecek
      }
    }
  }, [visible, ad.id, ad.provider, adsenseEnabled, publisherId, consented]);

  const minHeight = ad.height ? `${ad.height}px` : "100px";

  function handleClick() {
    navigator.sendBeacon?.(`/api/ads/${ad.id}/click`);
  }

  return (
    <div ref={containerRef} style={{ minHeight }} className="flex w-full flex-col items-center justify-center">
      <span className="ad-slot-label">Reklam</span>
      {!visible ? (
        <div style={{ minHeight }} className="w-full rounded bg-neutral-100 dark:bg-neutral-800" />
      ) : ad.provider === "MANUAL" ? (
        <a
          href={ad.targetUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="block w-full"
        >
          {ad.imageMedia ? (
            <div className="relative w-full" style={{ aspectRatio: ad.width && ad.height ? `${ad.width} / ${ad.height}` : "16 / 5" }}>
              <Image src={ad.imageMedia.url} alt={ad.headline ?? "Reklam"} fill className="object-contain" />
            </div>
          ) : (
            <div style={{ minHeight }} className="flex items-center justify-center rounded border border-dashed border-neutral-300 text-sm text-neutral-400">
              {ad.headline ?? "Reklam"}
            </div>
          )}
        </a>
      ) : adsenseEnabled && publisherId && consented ? (
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight }}
          data-ad-client={publisherId}
          data-ad-slot={ad.adUnitSlotId ?? ""}
          data-ad-format={ad.isResponsive ? "auto" : undefined}
          data-full-width-responsive={ad.isResponsive ? "true" : undefined}
        />
      ) : (
        <div
          style={{ minHeight }}
          className="flex w-full items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400"
        >
          Reklam alanı (test modu)
        </div>
      )}
    </div>
  );
}
