const CONSENT_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
`;

/**
 * Google Consent Mode v2: kullanici onay vermeden reklam/analiz cerezleri
 * calismasin diye sayfa yuklenir yuklenmez varsayilan "denied" durumu
 * tanimlanir. ConsentBanner kullanici secimine gore bu durumu gunceller.
 */
export function GoogleConsentDefaults() {
  return <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />;
}
