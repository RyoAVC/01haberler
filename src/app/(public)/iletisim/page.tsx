import type { Metadata } from "next";

export const metadata: Metadata = { title: "İletişim" };

export default function ContactPage() {
  return (
    <div className="container-page max-w-measure py-10">
      <h1 className="font-serif text-headline-l">İletişim</h1>
      <div className="prose prose-neutral mt-4 text-body dark:prose-invert">
        <p>
          Haber ihbarı, düzeltme talebi, telif bildirimi veya reklam iş birlikleri için bize
          <a href="mailto:iletisim@01haberler.com"> iletisim@01haberler.com</a> adresinden ulaşabilirsiniz.
        </p>
        <p>Şirket unvanı, adres ve MERSİS bilgileri yasal gereklilikler netleştirildiğinde bu sayfaya eklenecektir.</p>
      </div>
    </div>
  );
}
