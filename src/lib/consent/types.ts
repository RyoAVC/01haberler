export interface ConsentState {
  necessary: true;
  analytics: boolean;
  ads: boolean;
  personalizedAds: boolean;
  updatedAt: string;
}

export const CONSENT_COOKIE_NAME = "01h_consent";
export const CONSENT_VERSION = 1;
