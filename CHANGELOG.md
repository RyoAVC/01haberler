# Sürüm geçmişi

Sürüm numarası package.json ve package-lock.json ile birlikte güncellenir.
Dağıtım doğrulandıktan sonra aynı sürümün özellikleri /admin/surumler bölümüne kaydedilir.
Yayına çıkmayan işler panelde taslak olarak tutulur; tamamlanmış gibi gösterilmez.

## 1.3.0 — 2026-09-17

- Haber düzenleyicide yazdıkça güncellenen yayın kalite kontrolü.
- Başlık/spot sınırları, boş gövde, spot tekrarı, kategori, kapak ve alt metin uyarıları.
- SEO alanlarının uzunluk kontrolü; isteğe bağlı boş alanlar uyarı oluşturmaz.
- Kelime/başlık sayacı ve uyarıdan ilgili alana klavyeyle erişilebilir geçiş.
- Uyarılar editöre yardımcıdır; doğruluk onayı veya yeni yayın engeli değildir.
- 50 birim testi, TypeScript ve ESLint kontrolleri.

## 1.2.0 — 2026-09-17

- Aramaya kategori, başlangıç/bitiş günü ve en yeni/en eski/en çok okunan sıralaması eklendi.
- Filtreler sayfalama bağlantılarında korunur; yalnız kategori veya tarihle arama yapılabilir.
- Geçersiz tarih ve ters aralıklar anlaşılır mesajlarla ele alınır; tarih sınırları Türkiye saatine göredir.
- Kaynak kategorisi haber çekmeden kaydedilebilir. Kaynak varsayılanına geri dönme düzeltildi.
- Kategori değişiklikleri yetki kontrolü, aktif kategori doğrulaması ve atomik denetim kaydı içerir.
- Yönetim panelindeki haber listesine durum filtresini koruyan sayfalama eklendi.
- 44 birim testi, TypeScript ve ESLint kontrolleri geçti.

## 1.1.0 — 2026-09-17

- Sayfalı /son-haberler akışı, çalışan Tümü bağlantısı ve mobil erişim.
- Test manşetinin vitrinden ayrılması, eksik manşetlerin tamamlanması, iki sütun ve fikstür yerleşimi.
- Görselsiz manşetlerde büyük yer tutucunun kaldırılması ve masaüstü görsel yüksekliği sınırı.
- Aynı spot/gövde tekrarının önlenmesi.
- Reklam boyutlandırması, cihaz görünürlüğü ve yükleme hatası alternatifi.
- Türkiye saat dilimi; erişilebilir haber şeridi davranışı.
- 33 birim testi, TypeScript, ESLint ve canlı kontroller.

## 1.0.0

Önceki yayın: temel haber yönetimi, modüller, RSS, yorum, anket, bildirim,
sosyal otomasyon, yönlendirmeler, sürümler ve marka altyapısı. Ayrıntıları yönetim panelindedir.
