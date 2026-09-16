import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { PushOptIn } from "@/components/push/PushOptIn";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { env } from "@/lib/env";

// Header/BreakingNewsBar her istekte DB'den kategori ve son dakika haberi
// okur; bu nedenle bu layout altindaki tum sayfalar dinamik render edilir
// (build zamaninda DB erisimi gerektiren statik uretim denenmez).
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const pushEnabled = await isModuleEnabled("push");

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-brand-red focus:px-3 focus:py-2 focus:text-white"
      >
        İçeriğe geç
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <ConsentBanner />
      {pushEnabled && <PushOptIn vapidPublicKey={env.VAPID_PUBLIC_KEY} />}
    </>
  );
}
