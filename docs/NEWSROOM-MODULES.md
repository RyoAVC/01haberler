# Haber merkezi — 1.9.0

Bu paket, geliştirme planındaki 12 modülün ilk sürümlerini birleştirir. Üretim dağıtımı ve dış sağlayıcı kurulumu, kodun hazırlanmasından ayrı doğrulanır.

| Modül | Yönetim / kullanım | Bu sürüm |
|---|---|---|
| Yayın kalite kontrolü | Haber editörü | Başlık/spot, kategori, görsel, kaynak URL ve kaynak tarihi uyarıları; gerçeklik kontrolü editörde |
| Manşet planlayıcı | /admin/vitrin | Üç konum, Türkiye saatiyle başlangıç/bitiş, otomatik alternatif, sürükleme/klavye sıralaması, mobil yerleşim önizlemesi |
| Medya merkezi | /admin/medya | Arama, kullanım bilgisi, alt metin, hak/kaynak notları, manşet odak noktası |
| Operasyon merkezi | /admin/operasyon | Kaynak/iş geçmişi, cron başlangıç/bitişi, geciken yayınlar, sağlayıcı ayarlarının varlığı |
| Konu dosyaları | /admin/dosyalar → konu | Özet, kişi/kurum araması, seçili yayındaki haberler, taslak/yayın/tamamlandı |
| Yazar profilleri | /admin/yazarlar | Biyografi, uzmanlık, mevcut yazarın haber listesi; kullanıcı kendi profilini, yönetici tüm profilleri düzenler |
| Canlı anlatım | /admin/dosyalar → canli | Saatli gelişmeler, sayfadaki gelişmeleri sabitleme, zorunlu düzeltme notu, kalıcı bağlantı, tamamlanmış arşiv |
| Yerel haber merkezi | /admin/dosyalar → yerel | Şehir/ilçe dosyası, konum izni istemeyen şehir filtresi |
| Kaydetme/takip | /okuma-listem ve /takip | Cihazda kayıt; en fazla 100 takip, konu/yazar/canlı/yerel dosyaları |
| İhbar ve düzeltme | /ihbar, /admin/basvurular | Referans, açık bilgilendirme/onay, hız sınırı, moderasyon, özel iç not; dosya yüklemesi yok |
| E-posta bülteni | /bulten, /admin/bulten | Çift aşamalı onay, 48 saatlik onay bağlantısı, abonelikten çıkış, günlük özet taslağı ve editör onaylı gönderim |
| AI yardımcısı | Haber editörü | Başlık, spot, SEO ve etiket önerisi; editör başına saatte 20 istek, doğrudan AI yayını yok |

## İşleyiş ve sınırlar

- Yeni dosyalar başlangıçta taslaktır. Yayın yalnızca `article:publish` yetkili editörün seçimiyle yapılır. Bağlı haberler her genel sayfa isteğinde yeniden yayın durumu filtresinden geçer.
- Kayıtlar mevcut `SiteSetting` tablosunda ayrı `newsroom.*` anahtarlarıyla saklanır. Yeni veritabanı tablosu veya `db push` üretimde gerekmez. Güncelleme zamanıyla eşzamanlı düzenleme kontrolü ve işlem içinde denetim kaydı uygulanır.
- İlk sürüm sınırları: dosya başına 100 haber; liste başına 25 dosya, sayfa başına 50 canlı gelişme. Büyük hacimde ayrı ilişkisel tablolar ve indeksler için veri taşıma planlanmalıdır. Canlı akış manuel yenilenir; WebSocket yoktur.
- Şehir, ilçe ve haber ilişkilerini editör seçer. Haberlerin konumu yapay zekâ veya başlıktan otomatik çıkarılmaz.
- Yazar adresleri mevcut bağlantıları korumak için değiştirilemez. Yazar oluşturma mevcut kullanıcı hesabına bağlanır. Haber revizyonları mevcut editör ekranında izlenir; geçmiş taslaklar herkese açık yazar sayfasına çıkarılmaz.
- Takip tercihleri bu tarayıcıda kalır; hesap eşitlemesi ve otomatik takip bildirimi yoktur.
- İhbar formu saatte IP başına 3 başvuru kabul eder. Başvuru içerikleri yayımlanmaz. Saklama/silme politikasını işletmeci belirlemelidir.
- AI ile kaynak düzenleme bayrağının eski teknik anahtarı `aiAutoPublish` uyumluluk için korunur; artık yalnızca incelemeye alınan içerik hazırlar. `PUBLISHED` yazmaz ve sosyal paylaşım yapmaz.

## Bülten kurulumu

Hostinger ortam değişkenlerine `RESEND_API_KEY` ve Resend üzerinde doğrulanmış gönderen adresini `NEWSLETTER_FROM` olarak ekleyin. `APP_URL` üretimde HTTPS olmalı. Anahtarlar kaynak koduna veya panel metinlerine yazılmamalı.

Uygulama ek paket gerektirmeden resmi [Resend e-posta API'sini](https://resend.com/docs/api-reference/emails/send-email) kullanır. Başarılı API yanıtı gönderimin sağlayıcı tarafından kabulüdür; gelen kutusuna teslim garantisi değildir.

1. Abone açık onay verir; e-posta doğrulanana kadar PENDING kalır.
2. E-posta bağlantısı yalnızca tercih ekranını açar. İşlem düğmeye basıldığında POST ile gerçekleşir; link tarayıcıları kendiliğinden abonelik değiştirmez.
3. Editör son 24 saatin haberlerinden hazırlanan metni düzenleyip kaydeder. Kayıt gönderim yapmaz.
4. Açık onayla sonraki en fazla 5 aboneye gönderim yapılır. Her grup ayrı çalıştırılır; otomatik günlük gönderim bu sürümde yoktur.
5. Benzersiz teslimat kaydı ve sağlayıcı idempotency anahtarı tekrarı engeller. REJECTED/UNCERTAIN sonuçlar kendiliğinden yeniden gönderilmez. SENDING uzun sürerse sağlayıcı kayıtlarıyla eşleştirilmelidir.
6. Gönderim listesi bülten oluşturulduğunda doğrulanmış aboneleri kapsar. Her adres gönderim öncesi yeniden kontrol edilir; sıraya alınmış ve sağlayıcıya ulaşmış bir ileti geri çekilemez.

Abone e-postaları özel veridir. Yönetim sayfasında yalnızca toplu sayılar görünür. Onay ve çıkış bağlantıları imzalıdır; `SESSION_SECRET` değişirse önceki bağlantılar geçersiz olur.

## Doğrulama ve geri dönüş

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- GitHub CI, izole PostgreSQL/Redis üzerinde şemayı kurar. `prisma db push` yalnızca CI'nin boş test veritabanında çalıştırılır.
- Tarayıcı testleri taslak gizliliği, dosya yayını/takip, ihbar ve yapılandırılmamış bülten durumunu kontrol eder. Gerçek e-posta veya AI isteği göndermez.
- Canlıya geçişte ana sayfa, dosya dizinleri, /admin/moduller ve /admin/surumler kontrol edilmelidir. Gerçek kullanıcı verileriyle test haberi yayımlamayın.
- Kod geri dönüşü önceki Hostinger dağıtımına yapılabilir. Yeni `newsroom.*` kayıtları eski sürüm tarafından kullanılmaz; otomatik silinmez. Bu belge veritabanı yedeğinin yerine geçmez.

## Sonraki kapsam

İhbar eki, hesapla eşitleme, kişiye özel bildirim, otomatik bülten takvimi, canlı akışın otomatik yenilenmesi, medya görselinin kendi içinde odak seçme ve herkese açık düzeltme tarihçesi ayrı geliştirmelerdir. Buradaki kurulum ilk sürüm kapsamıdır.
