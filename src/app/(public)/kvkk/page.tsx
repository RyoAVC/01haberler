import type { Metadata } from "next";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

export default function KvkkPage() {
  return (
    <div className="container-page max-w-measure py-10">
      <h1 className="font-serif text-headline-l">KVKK Aydınlatma Metni</h1>
      <div className="prose prose-neutral mt-4 text-body dark:prose-invert">
        <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Bu metin genel bir şablondur; 6698 sayılı KVKK kapsamında yayına almadan önce bir hukuk danışmanına
          gözden geçirtmenizi öneririz. Şirket unvanı ve veri sorumlusu iletişim bilgileri netleştiğinde
          eklenecektir.
        </p>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, siteyi ziyaretiniz sırasında elde edilen
          kişisel verileriniz (teknik günlük verileri, onay verdiğiniz takdirde çerez verileri) veri sorumlusu
          sıfatıyla işlenmektedir.
        </p>
        <h2>İşleme Amaçları</h2>
        <p>Site güvenliğinin sağlanması, kullanım analizleri ve onay verdiğiniz durumda reklam kişiselleştirmesi.</p>
        <h2>Haklarınız</h2>
        <p>
          KVKK&apos;nın 11. maddesi kapsamındaki haklarınızı (verilerinize erişim, düzeltme, silme talep etme vb.)
          kullanmak için <a href="/iletisim">İletişim</a> sayfasındaki kanallardan bize ulaşabilirsiniz.
        </p>
      </div>
    </div>
  );
}
