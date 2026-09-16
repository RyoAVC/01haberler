import Link from "next/link";
import { getFooterLinks } from "@/server/services/footerLinksService";
import { AvcHaberSoftBrand } from "@/components/ui/BrandMark";

export async function Footer() {
  const year = new Date().getFullYear();
  const footerLinks = await getFooterLinks();
  return (
    <footer className="mt-16 rule-top bg-surface dark:bg-surface-dark">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center bg-brand-red text-sm font-bold text-white">
              01
            </span>
            <span className="font-serif text-headline-m font-bold">Haberler</span>
          </div>
          <p className="mt-3 max-w-xs text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Türkiye ve dünyadan güncel haberler. Bağımsız, hızlı ve güvenilir haber akışı.
          </p>
        </div>

        <div>
          <h3 className="text-meta font-semibold uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">
            Kurumsal
          </h3>
          <ul className="mt-3 space-y-2 text-headline-s font-normal">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-secondary hover:text-brand-red dark:text-ink-dark-secondary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-meta font-semibold uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">
            Takip Edin
          </h3>
          <ul className="mt-3 space-y-2 text-headline-s font-normal text-ink-secondary dark:text-ink-dark-secondary">
            <li>
              RSS: <Link href="/rss.xml" className="hover:text-brand-red">/rss.xml</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="rule-top flex flex-col items-center gap-2 py-4 text-center text-caption text-ink-secondary dark:text-ink-dark-secondary sm:flex-row sm:justify-between sm:px-6">
        <span>© {year} 01 Haberler. Tüm hakları saklıdır.</span>
        <AvcHaberSoftBrand />
      </div>
    </footer>
  );
}
