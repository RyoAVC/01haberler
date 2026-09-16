import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hakkımızda" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-measure py-10">
      <h1 className="font-serif text-headline-l">Hakkımızda</h1>
      <div className="prose prose-neutral mt-4 text-body dark:prose-invert">
        <p>
          01 Haberler, Türkiye ve dünyadan gündem, ekonomi, spor, teknoloji ve yaşam haberlerini bir araya getiren
          dijital bir haber portalıdır. Haberlerimizi kendi editör ekibimiz hazırlar; ayrıca kullanım şartlarını
          doğruladığımız kaynaklardan gelen RSS özetleri, yayınlanmadan önce editör onayından geçer.
        </p>
        <p>
          Her otomatik derlenen haberde orijinal kaynağın adı ve bağlantısı açıkça belirtilir. Amacımız hızlı,
          doğrulanabilir ve şeffaf bir haber akışı sunmaktır.
        </p>
      </div>
    </div>
  );
}
