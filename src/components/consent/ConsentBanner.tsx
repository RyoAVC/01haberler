"use client";

import { useEffect, useState } from "react";
import { CONSENT_COOKIE_NAME, CONSENT_VERSION, type ConsentState } from "@/lib/consent/types";

function applyConsent(state: ConsentState) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("consent", "update", {
    ad_storage: state.ads ? "granted" : "denied",
    ad_user_data: state.ads ? "granted" : "denied",
    ad_personalization: state.personalizedAds ? "granted" : "denied",
    analytics_storage: state.analytics ? "granted" : "denied",
  });
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify({ v: CONSENT_VERSION, ...state })
  )}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
}

function readStoredConsent(): ConsentState | null {
  const match = document.cookie.match(new RegExp(`${CONSENT_COOKIE_NAME}=([^;]+)`));
  if (!match || !match[1]) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    if (parsed.v !== CONSENT_VERSION) return null;
    return parsed as ConsentState;
  } catch {
    return null;
  }
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      applyConsent(stored);
    } else {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function choose(analyticsAndAds: boolean) {
    const state: ConsentState = {
      necessary: true,
      analytics: analyticsAndAds,
      ads: analyticsAndAds,
      personalizedAds: analyticsAndAds,
      updatedAt: new Date().toISOString(),
    };
    applyConsent(state);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed inset-x-0 bottom-0 z-50 rule-top bg-surface-raised p-4 dark:bg-surface-dark-raised"
    >
      <div className="container-page flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Size daha iyi bir deneyim sunmak ve reklamları kişiselleştirmek için çerezler kullanıyoruz. Tercihinizi
          dilediğiniz zaman{" "}
          <a href="/gizlilik" className="text-brand-red underline">
            Gizlilik Politikası
          </a>{" "}
          sayfasından güncelleyebilirsiniz.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="border border-line px-4 py-2 text-headline-s dark:border-line-dark"
          >
            Yalnızca Gerekli
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
