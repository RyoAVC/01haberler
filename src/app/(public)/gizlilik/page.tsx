import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gizlilik Politikası" };

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-measure py-10">
      <h1 className="font-serif text-headline-l">Gizlilik Politikası</h1>
      <div className="prose prose-neutral mt-4 text-body dark:prose-invert">
        <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Bu metin genel bir şablondur; yayına almadan önce bir hukuk danışmanına gözden geçirtmenizi öneririz.
        </p>
        <h2>Topladığımız Veriler</h2>
        <p>
          Siteyi ziyaret ettiğinizde teknik günlük verileri (IP adresi, tarayıcı bilgisi) ve, onay verdiğiniz
          takdirde, analiz/reklam çerezleri aracılığıyla kullanım verileri toplanabilir.
        </p>
        <h2>Çerezler</h2>
        <p>
          Zorunlu çerezler sitenin çalışması için gereklidir ve onay gerektirmez. Analiz ve reklam çerezleri
          yalnızca <a href="/cerez-politikasi">Çerez Politikası</a> sayfasında açıklanan onay mekanizmasıyla
          etkinleştirilir; tercihinizi istediğiniz zaman değiştirebilirsiniz.
        </p>
        <h2>Üçüncü Taraflarla Paylaşım</h2>
        <p>
          Onay verdiğiniz reklam/analiz sağlayıcıları (ör. Google) dışında verileriniz üçüncü taraflarla
          paylaşılmaz.
        </p>
        <h2>Haklarınız</h2>
        <p>
          Kişisel verilerinizle ilgili talepleriniz için <a href="/kvkk">KVKK Aydınlatma Metni</a>&apos;nde belirtilen
          iletişim kanallarını kullanabilirsiniz.
        </p>
      </div>
    </div>
  );
}
