import type { Metadata } from "next";

export const metadata: Metadata = { title: "Çerez Politikası" };

export default function CookiePolicyPage() {
  return (
    <div className="container-page max-w-measure py-10">
      <h1 className="font-serif text-headline-l">Çerez Politikası</h1>
      <div className="prose prose-neutral mt-4 text-body dark:prose-invert">
        <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Bu metin genel bir şablondur; yayına almadan önce bir hukuk danışmanına gözden geçirtmenizi öneririz.
        </p>
        <h2>Çerez Kategorileri</h2>
        <ul>
          <li><strong>Zorunlu:</strong> Oturum yönetimi ve güvenlik için gereklidir, kapatılamaz.</li>
          <li><strong>Analiz:</strong> Site kullanımını anlamamıza yardımcı olur; yalnızca onayınızla etkinleşir.</li>
          <li><strong>Reklam:</strong> İlgi alanınıza uygun reklam gösterimi için kullanılır; yalnızca onayınızla ve
            Google Consent Mode v2 ile uyumlu biçimde etkinleşir.</li>
        </ul>
        <h2>Tercihinizi Güncelleme</h2>
        <p>
          Sayfanın altındaki çerez bildirimi ilk ziyaretinizde görünür. Tercihinizi değiştirmek için tarayıcı
          çerezlerinizi temizleyip sayfayı yenileyebilirsiniz; ileride bu sayfaya bir &ldquo;tercihleri yönet&rdquo;
          kontrolü eklenmesi planlanmaktadır.
        </p>
      </div>
    </div>
  );
}
