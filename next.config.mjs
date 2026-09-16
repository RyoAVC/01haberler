const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com",
      "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Kullanicinin ana dizininde alakasiz bir baska projeye ait package-lock.json
  // bulunabildiginden Next, proje kokunu yanlis tahmin edip uyari verebiliyor;
  // kok dizini burada acikca sabitliyoruz.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // Not: uzak gorsel URL'leri admin panelinde tanimlanan domain
    // allowlist'i uygulama katmaninda (src/server/ingestion/imagePolicy.ts)
    // zaten sinirlandirilir; buradaki https joker deseni yalnizca
    // next/image optimizasyonuna izin verir.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
