export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const body = `# 01 Haberler

> Türkiye ve dünyadan güncel haberler sunan bağımsız bir Türkçe haber portalı.

01 Haberler; gündem, dünya, ekonomi, teknoloji, spor ve yerel haberler kategorilerinde
güncel içerik yayınlar. İçerikler editoryal incelemeden geçirilir.

## Önemli Bağlantılar

- Ana sayfa: ${appUrl}/
- RSS beslemesi: ${appUrl}/rss.xml
- Haber sitemap: ${appUrl}/news-sitemap.xml
- Genel sitemap: ${appUrl}/sitemap.xml
- Hakkımızda: ${appUrl}/hakkimizda
- İletişim: ${appUrl}/iletisim

## Kullanım Notları

İçerikler telif hakkı ile korunmaktadır. Alıntılarken kaynak ve bağlantı belirtilmesi
rica olunur.
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
