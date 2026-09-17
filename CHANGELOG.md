# Sürüm geçmişi

Sürüm numarası package.json ve package-lock.json ile birlikte güncellenir.
Dağıtım doğrulandıktan sonra aynı sürümün özellikleri /admin/surumler bölümüne kaydedilir.
Yayına çıkmayan işler panelde taslak olarak tutulur; tamamlanmış gibi gösterilmez.

## 1.15.0 — 2026-09-17

- Kompakt piyasa kartları ve 60 saniyelik kontrol göstergesi; günlük referans ve hesaplanmış gösterge açıklamaları korundu.
- Ana sayfa kategori bölümlerine kısayollar ve bölüm vurguları.
- Geniş ekran kenarlarında kategori/son gelişmeler, çok okunanlar ve ihbar/takip bağlantıları; sponsor reklamları korundu.

## 1.14.0 — 2026-09-17

- Ana sayfa manşetle başlar; piyasa radarı ve son haber şeridi altına taşındı.
- Modern logo düzeni, masaüstü arama formu ve belirgin son haber bağlantısı.
- Mobil header kompakt tutuldu; menü, tema ve arama erişimi korundu.

## 1.13.0 — 2026-09-17

- Dosyalarda elle haber kimliği girmek yerine başlık araması ve tek tıklamayla seçim.
- Seçim sıralama, kaldırma, tekrar engeli ve 100 haber sınırı.
- Mevcut eski seçimler korunur; yayından kaldırılan haberler işaretlenir.

## 1.12.0 — 2026-09-17

- Aktif canlı anlatımda 30 saniyelik otomatik yenileme; duraklat/sürdür ve elle yenileme.
- Son içerik güncellemesi TSİ ile gösterilir. Gizli sekmelerde ve çevrimdışıyken otomatik istek yapılmaz.
- Tamamlanmış dosyalar, eski sayfalar ve kalıcı gelişme bağlantıları otomatik yenilenmez.

## 1.11.0 — 2026-09-17

- Medya üzerinde tıklayarak odak seçimi, klavye ile yüzde ayarı ve merkeze alma.
- 16:9 geniş ekran ve 4:5 mobil kırpma önizlemesi. Özgün medya dosyası değişmez.
- Görsel yükleme hatasında elle odak düzenleme açıklaması.
- Sahiplik, yetki, audit ve sunucu koordinat doğrulaması korunur.

## 1.10.0 — 2026-09-17

- Haber havuzundan birincil/ikincil manşete sürükle-bırak ve erişilebilir yerleştirme düğmeleri.
- Mobil/masaüstü önizleme ve Türkiye saatiyle önizleme anı seçimi.
- Mükerrer haber seçimi arayüzde ve sunucuda engellenir. Otomatik alternatifler en yeni yayındaki haberden başlar.
- Her başarılı kayıt, seçilen haberler/zamanlar/banner tercihi ve kullanıcı bilgisiyle aynı işlemde audit log oluşturur.
- Yetki ve yayın/tarih kontrolleri korunur; başarısız kayıtta form korunur, çift gönderim engellenir.
- Son 200 habere ek olarak mevcut eski seçimler havuza dahil edilir.
- Zaman geçişi ana sayfanın sonraki isteğinde uygulanır; açık sekmeler kendiliğinden yenilenmez.
## 1.9.0 — 2026-09-17

- Manşet yayın aralıkları, sürükle-bırak ve klavye sıralaması, mobil önizleme.
- Konu dosyaları, şehir/ilçe merkezleri ve canlı anlatım için ortak editör yönetimi; taslak gizliliği, ilişkili haberler, kişi/kurum araması, düzeltme ve kalıcı gelişme bağlantıları.
- Yazar biyografisi ve uzmanlık yönetimi; cihazda konu, şehir dosyası, canlı anlatım ve yazar takibi.
- İhbar/düzeltme başvuruları: açık onay, hız sınırı, referans numarası, özel moderasyon kuyruğu ve denetim kaydı.
- Bülten: Resend bağlantısı, çift aşamalı abonelik onayı, POST ile abonelikten çıkış, günlük özet hazırlama, editör onaylı beş kişilik gönderim grupları ve yinelenen gönderim koruması. Sağlayıcı yapılandırılmadığında abonelik kapalıdır.
- Medya merkezinde odak noktası; ana sayfa manşetinde odaklı kırpma. Kaynak bağlantısı ve tarih için kalite uyarıları. Cron son çalışma ve gecikme görünürlüğü.
- AI başlık/etiket önerileri, saatlik editör kotası, kaynak metne bağlı talimatlar ve süre sınırı. Kaynaklardan AI ile hazırlanan içerikler otomatik yayımlanmaz; editör incelemesine gider.
- Yeni ana sayfa keşif alanı; Avcı E-Ticaret bannerlarında siyah/kırmızı tasarım ve okunaklı mobil yerleşim.
- Sürümler ekranına yazılımla gelen kayıt; Modüller ekranında 12 modülün bağlantısı ve kapsamı.
- CI, gerçek varsayılan dal olan master için de çalışır; izole PostgreSQL/Redis ve tarayıcı senaryoları eklenmiştir.
- Kurulum/yönetim sayfaları istek sırasında oluşturulur; Redis bağlantısı ilk kullanıma ertelenir.

Kullanım, sınırlar ve geri dönüş: `docs/NEWSROOM-MODULES.md`.

## 1.8.0 — 2026-09-17

- Avcı E-Ticaret bannerları gerçek marka logo ve banner varlıklarıyla yenilendi.
- Kompakt ana sayfa reklamında verilen animasyonlu GIF kullanılıyor; masaüstü railinde logo korunuyor.
- Avcı CTA hedefi `https://avcieticaret.com` olarak korunuyor; reklam etiketi ve sponsor bağlantı niteliği sürüyor.

## 1.7.0 — 2026-09-17

- Sekmeye ve kullanıcıya özel geçici metin kurtarma: başlık, spot, gövde ve SEO metinleri; elle geri alma, 24 saatlik geçerlilik ve başarılı kayıtta temizleme.
- Editörde metin önizlemesi; beklenmedik kayıt hatasında metni koruyan açıklayıcı hata.
- Haber kartlarında görselsiz içerik için tipografik düzen; büyük boş görsel alanı kaldırıldı.
- Kategori sayfalarında yeni başlık düzeni, mobilde tek sütun, haber sayısı, kategori araması ve yararlı boş durum.
- Medya aramasına ilgili haber başlığı eklendi; bilinmeyen dosya boyutu sıfır bayt gibi gösterilmiyor.

## 1.6.0 — 2026-09-17

- Medya Merkezi: dosya adı/alternatif metin araması, sayfalama, dosya ve kullanım bilgileri.
- Alternatif metin, fotoğrafçı/kaynak ve editöre özel kullanım hakkı notlarının denetim kaydıyla güncellenmesi.
- Haber editöründe mevcut görsel seçici ve gerçek kapak önizlemesi; aynı dosyayı tekrar yükleme ihtiyacı azaltıldı.
- Yazarların medya listesi ve değişiklikleri kendi yükledikleriyle sınırlı; editörler tüm kütüphaneyi yönetebilir.
- Kayıt hatası/çakışmasından sonra form alanları sıfırlanmıyor; kayıt ve yükleme sırasında yinelenen gönderim engelleniyor.
- Görsel yüklemede ağ hatası anlaşılır gösteriliyor ve yükleniyor durumu temizleniyor.

## 1.5.0 — 2026-09-17

- Türkiye saatiyle zamanlı yayın; geçersiz/geçmiş zaman kontrolü ve mevcut programın editörde gösterimi.
- Yetkili cron çağrısı, zamanı gelen haberleri işlem içinde yayınlar; çakışan iş aynı haberi yeniden yayınlamaz. Sosyal paylaşım tetiklemez.
- Haber düzenlemede sürüm kontrolü: başka bir işlem haberi değiştirdiyse eski form değişiklikleri ezemez.
- Yazarlar yalnızca kendilerine atanmış veya kendilerinin oluşturduğu haberleri düzenleyebilir.
- Son 10 düzenleme kaydı ile güncel metnin yan yana, salt okunur karşılaştırması.
- İncelemede durumunun editör formunda korunması; zamanlı olmayan kayıtlarda eski programın temizlenmesi.
- Haber yapılandırılmış verisinde HTML kapanış etiketleri güvenli kodlanıyor.
- 79 birim testi; zaman dilimi, çakışan cron, sahiplik, eşzamanlı düzenleme ve JSON-LD güvenliği senaryoları dahil.

## 1.4.0 — 2026-09-17

- Ana sayfa için görselli manşet düzeni, kategori bölümleri ve yeni piyasa paneli.
- Dolar/euro günlük referansları, ons altın ve hesaplanan gram altın; kaynak, tarih ve gecikme bilgisi.
- Görünür sekmede dakika başı piyasa yenileme, zaman aşımı ve son veri alternatifi.
- Avcı E-Ticaret / Adana360 özel sağ-sol bannerları; mobil yatay düzen.
- Ana Sayfa Vitrini: üç manşet seçimi, otomatik tamamlama, banner aç/kapa ve denetim kaydı.
- Operasyon Merkezi: kaynak sağlığı ve son haber alma işleri.
- Cihazda Okuma Listem; haber kaydetme/kaldırma ve 100 kayıt sınırı.
- Mobil yönetim menüsü daraltılabilir; bildirim daveti sayfa sonuna taşındı ve kapatma tercihi hatırlanıyor.
- Yeni RSS alımlarında kaynak tarihi korunuyor; tarihi belirsiz/gelecekteki içerik otomatik yayımlanmıyor. Mevcut eski kayıtların tarihleri değiştirilmedi.
- Cron kaynak aralıklarını gözetiyor; toplu onay mevcut yayın tarihini koruyor.
- Sitemap'te noindex arama yerine Son Haberler yer alıyor.

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
