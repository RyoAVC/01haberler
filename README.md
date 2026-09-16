# 01 Haberler

Türkçe haber portalı — Next.js 15, TypeScript, Prisma/PostgreSQL, Redis/BullMQ, Docker.

## İçindekiler

- [Yerel Kurulum](#yerel-kurulum)
- [Docker ile Kurulum](#docker-ile-kurulum)
- [Admin Kullanıcısı Oluşturma](#admin-kullanıcısı-oluşturma)
- [Haber Kaynağı (RSS) Ekleme](#haber-kaynağı-rss-ekleme)
- [Otomatik Haber Toplama (Bot) Çalıştırma](#otomatik-haber-toplama-bot-çalıştırma)
- [Yedekleme ve Geri Yükleme](#yedekleme-ve-geri-yükleme)
- [Güvenlik Notları](#güvenlik-notları)
- [AvcHaberSoft — Faz 1 Özellikleri](#avchabersoft--faz-1-özellikleri)
- [Bilinen Sınırlamalar ve Sıradaki Adımlar](#bilinen-sınırlamalar-ve-sıradaki-adımlar)

## Yerel Kurulum

Gereksinimler: Node.js 20+, PostgreSQL 16, Redis 7 (yerelde kurulu değilse `docker-compose up postgres redis` ile başlatabilirsiniz).

```bash
npm install
cp .env.example .env
# .env icindeki DATABASE_URL, REDIS_URL, SESSION_SECRET degerlerini duzenleyin
# SESSION_SECRET icin: openssl rand -base64 48
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Site `http://localhost:3000` adresinde, admin paneli `http://localhost:3000/admin/giris` adresinde açılır. Seed komutu ilk süper admin hesabını oluşturur (varsayılan `admin@01haberler.com`, terminale yazdırılan geçici parola ile — **ilk girişten sonra mutlaka değiştirin**, ideal olarak üretimde `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` ortam değişkenleriyle kendi değerlerinizi verin).

**Docker/kendi sunucunuz yerine Supabase gibi pgbouncer/pooler kullanan bir Postgres kullanıyorsanız:** `DATABASE_URL`'i transaction pooler'a (genelde port 6543, `?pgbouncer=true&connection_limit=5` ekleyin), `DIRECT_URL`'i ise session/doğrudan bağlantıya (port 5432) verin — `prisma/schema.prisma`'daki `directUrl` yalnızca `migrate`/`db push` sırasında kullanılır. Bunu ayırmazsanız çok sayıda eşzamanlı bağlantıda (ör. birden fazla `npm run dev` örneği) ücretsiz katmanların bağlantı limitine takılabilirsiniz. Ayrıca serverless/pooler tabanlı DB'lerde `prisma migrate dev` shadow database izinleri kısıtlı olabilir; bu durumda `npx prisma db push` kullanın.

**PowerShell'de `npm` komutları "running scripts is disabled" hatasıyla çalışmıyorsa:** yönetici olarak PowerShell açıp `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` çalıştırın, ya da komutları Git Bash/cmd.exe üzerinden çalıştırın.

## Docker ile Kurulum

```bash
cp .env.example .env
# .env dosyasini duzenleyin (production'da COOKIE_SECURE=true yapin)
docker compose up -d postgres redis
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run prisma:seed
docker compose up -d
```

Nginx `:80` portunda `web` servisine reverse proxy yapar; `ingestion-worker` servisi RSS/bot görevlerini ayrı bir process olarak çalıştırır.

## Admin Kullanıcısı Oluşturma

```bash
npm run admin:create -- --email=editor@01haberler.com --password=GucluBirParola123! --name="Ad Soyad" --role=EDITOR
```

Roller: `SUPER_ADMIN`, `EDITOR`, `AUTHOR`.

## Haber Kaynağı (RSS) Ekleme

1. `/admin/kaynaklar` sayfasına gidin (yalnızca `SUPER_ADMIN`/`EDITOR` erişebilir).
2. "Yeni Kaynak Ekle" formunu doldurun — **Lisans/kullanım şartı notu alanı zorunludur**: kaynağın RSS/telif şartlarını (tam metin mi kısa özet mi yayınlanabilir, atıf zorunluluğu vb.) kısaca yazın.
3. Kaynağı ekledikten sonra altındaki "+ Feed Ekle" ile RSS/Atom URL'sini ekleyin.
4. Eklenen URL, `assertPublicHttpUrl` (SSRF koruması) ile doğrulanır — localhost, özel IP aralıkları ve bulut metadata adresleri reddedilir.
5. Feed'i "Şimdi Çalıştır" ile manuel tetikleyebilir veya `fetchIntervalMinutes` değerine göre otomatik çalışmasını bekleyebilirsiniz (worker'ın çalışıyor olması gerekir, aşağıya bakın).

**Önemli:** Otomatik çekilen tüm haberler ilk sürümde her zaman "İncelemede" (`PENDING_REVIEW`) durumuna düşer ve `/admin/haberler?durum=PENDING_REVIEW` sayfasından editör onayı olmadan yayınlanmaz — kaynağın "güvenilir" işaretlenmesi bu davranışı MVP'de değiştirmez (bilinçli güvenlik/telif tercihi).

## Otomatik Haber Toplama (Bot) Çalıştırma

```bash
# Surekli calisan worker (zamanlanmis + manuel tetiklenen gorevleri isler)
npm run ingestion:worker

# Tek seferlik: tum aktif feed'leri hemen calistir
npm run ingestion:run

# Tek seferlik: belirli bir feed'i calistir
npm run ingestion:run -- --feed=<feedId>
```

Her çalıştırma bir `IngestionJob` kaydı ve satır satır `IngestionLog` üretir; tekrar eden haberler `sourceUrl` (canonicalize edilmiş) ve içerik hash'i üzerinden engellenir.

## Yedekleme ve Geri Yükleme

```bash
DATABASE_URL="postgresql://..." bash scripts/backup-db.sh
# cikti: ./backups/01haberler-YYYYMMDD-HHMMSS.sql.gz

# geri yukleme
gunzip -c backups/01haberler-<tarih>.sql.gz | psql "$DATABASE_URL"
```

Üretimde bu scripti günlük bir cron/scheduled task ile çalıştırıp çıktıyı ayrı bir depolama alanına (S3 vb.) taşımanız önerilir.

## Güvenlik Notları

- Parolalar Argon2id ile hash'lenir; oturumlar DB'de tutulan, HttpOnly/SameSite=Lax cookie ile eşleşen rastgele token'lardır (üretimde `.env` içinde `COOKIE_SECURE=true` yapın, HTTPS zorunludur).
- Admin girişinde IP bazlı rate limit (Redis) ve brute-force'a karşı sabit gecikmeli genel hata mesajı uygulanır.
- Medya yüklemede hem MIME tipi hem dosyanın ilk baytları (magic bytes) doğrulanır; yalnızca JPEG/PNG/WEBP/GIF kabul edilir.
- Kaynak/RSS URL'leri eklenirken SSRF koruması (`src/lib/security/ssrf.ts`) localhost, özel IP bloklarını ve DNS çözümlemesiyle bunlara yönlenen alan adlarını reddeder.
- Haber HTML içeriği `sanitize-html` ile temizlenir (izinli etiket/öznitelik allowlist'i).
- `next.config.ts` güvenlik başlıkları (CSP, X-Frame-Options, Referrer-Policy vb.) uygular.
- Bilinen kabul edilmiş risk: `npm audit`, Next.js'in bağladığı PostCSS'te büyük ölçekli major sürüm (Next 16) gerektiren düşük etkili bir kaynak-harita/path-traversal zafiyeti bildiriyor; site kullanıcı girdisinden CSS derlemediği için üretim riski düşük — Next 16'ya geçiş ayrı bir görev olarak planlanmalı.

## AvcHaberSoft — Faz 1 Özellikleri

Yazılım, tek bir haber sitesinin ötesine geçip başka domainlere de kurulabilen bir ürüne ("AvcHaberSoft" marka adıyla) dönüştürülmeye başlandı. Bu round'da eklenenler:

- **Modül aç/kapa paneli** (`/admin/moduller`) — Yorumlar, Anketler, Push Bildirimleri, Sosyal Otomasyon, 301 Yönlendirmeler tek yerden açılıp kapatılır. Varsayılan: hepsi kapalı, sadece Yönlendirmeler açık.
- **301 Yönlendirme yönetimi** (`/admin/yonlendirmeler`) — middleware'de (`src/middleware.ts`) uygulanır.
- **Sürüm / Değişiklik Günlüğü** (`/admin/surumler`) — her değişiklik bir sürüm numarasına bağlanır.
- **Yorum sistemi + moderasyon** (`/admin/yorumlar`) — haber detay sayfasında, modül açıkken görünür; yasaklı kelime kontrolünden geçer.
- **Anket modülü** (`/admin/anketler`) — ana sayfa kenar çubuğunda gösterilir.
- **Web push bildirimleri** (`/admin/bildirimler`) — çalışması için `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` ortam değişkenlerinin ayarlanması gerekir (`npx web-push generate-vapid-keys` ile üretilir).
- **Sosyal medya otomatik paylaşım** (`/admin/sosyal-otomasyon`) — haber yayınlandığında otomatik paylaşır; şu an yalnızca **Telegram** (bot token ile) gerçek entegrasyona sahiptir, X ve Facebook için gerçek API bağlantısı ayrıca eklenmelidir (OAuth uygulama onayı gerektirir). Yayınlama anında ayrıca Google'a sitemap ping'i atılır.
- **Lisans altyapısı (pasif)** — `License` modeli ve `checkLicense()` servisi var ama hiçbir sayfayı kısıtlamıyor; ileride gerçek uygulama için hazır. Gerçek lisans sahibi bilgisi yalnızca `/admin/lisans-detay` sayfasında (navigasyonda linki yok, sadece SUPER_ADMIN erişebilir) tutulur.
- **Kurulum sihirbazı** (`/kurulum`) — bu dosyalar başka bir domaine kopyalandığında (DB bağlantısı ve migration'lar zaten `.env`/`prisma migrate deploy` ile hazırlandıktan sonra) site adı, temel ayarlar ve ilk yönetici hesabını web arayüzünden oluşturur. Kurulum tamamlanınca bir daha çalışmaz; `SiteSetting` tablosunda `installed` anahtarı yoksa middleware tüm istekleri `/kurulum`'a yönlendirir.
- **AvcHaberSoft marka kimliği** — admin panel (sol menü altı), kurulum sihirbazı ve genel site alt bilgisinde görünür (`src/components/ui/BrandMark.tsx`).

### Sonraki Faz (bu round'da kapsam dışı bırakıldı)

- AA/DHA/İHA ajans botları — mevcut genel RSS/Atom bot her feed URL'sini destekliyor, sadece gerçek ücretli anlaşma/kimlik bilgisi gerekiyor.
- AMP sayfaları.
- Reklam/gelir özellikleri — zaten yeterince gelişmiş.
- Sürükle-bırak sayfa oluşturucu, e-gazete/PDF çevirmeli okuyucu, canlı skor/döviz/hava durumu widget'ları, kapak görseli ötesinde video galerisi, native mobil uygulamalar, eklenti/modül pazarı.

## Bilinen Sınırlamalar ve Sıradaki Adımlar

Bu depo, spesifikasyondaki kapsamın **çalışan bir MVP çekirdeğini** içerir. Aşağıdakiler bilinçli olarak MVP dışında bırakıldı ve yarım/sahte kod yazmak yerine açıkça not ediliyor:

- **Admin panel:** Kategori, etiket, kullanıcı (rol yönetimi dahil), reklam, denetim kaydı, yasaklı kelime/filtre yönetimi, profil/parola değiştirme, menü/footer bağlantı yönetimi ve temel site ayarları (ads.txt, varsayılan SEO açıklaması) ekranları eklendi ve çalışır durumda. Yasaklı kelime listesindeki "Engelle" şiddetindeki kelimeler haber kaydedilirken tespit edilirse kayıt reddedilir. Ana kategori menüsü `/admin/kategoriler`'daki sıralama/aktiflik ile, footer'daki "Kurumsal" bağlantı listesi ise `/admin/menu`'den yönetilir.
- **Zengin metin editörü eklendi:** Haber içeriği artık TipTap tabanlı bir WYSIWYG editörle girilir (kalın, italik, altı/üstü çizili, başlık, liste, alıntı, bağlantı); kaydedilirken yine sunucu tarafında sanitize edilir.
- **Etiket/yazar/kaynak genel sayfaları** (`/etiket/[slug]`, `/yazar/[slug]`, `/kaynak/[slug]`) ve **arama sayfası** eklendi ve çalışır durumda.
- **Kurumsal/legal sayfalar** (Hakkımızda, İletişim, Gizlilik, Çerez Politikası, KVKK) eklendi — ancak içerikleri genel şablon metinlerdir, gerçek şirket bilgileri ve hukuki onay olmadan yayına alınmamalıdır (sayfaların üzerinde bu uyarı açıkça belirtiliyor).
- **Örnek RSS kaynağı seed script'ine otomatik eklenmedi** (gerçek bir yayıncının şartlarını doğrulamadan URL uydurmak talimatlara aykırı olur), ancak bot altyapısı gerçek bir kaynakla (TRT Haber genel RSS akışı, `https://www.trthaber.com/manset.rss`) bizzat test edildi: 50 haber çekildi, tamamı `PENDING_REVIEW` durumuna düştü (otomatik yayınlanmadı), ikinci çalıştırmada 50/50 mükerrer olarak doğru şekilde engellendi. Kendi kaynağınızı `/admin/kaynaklar` üzerinden kullanım şartlarını kontrol ederek ekleyebilirsiniz.
- **Next.js 16.3.5'e (güncel kararlı sürüm, Turbopack ile) geçildi ve gerçekten doğrulandı** — build, tüm testler, admin girişi ve yetkilendirme koruması bu sürümde tekrar test edildi. İki not: (1) `eslint-config-next` bilinçli olarak `15.5.25`'te bırakıldı çünkü `16.3.5` sürümü, ESLint 9'un eski uyumluluk katmanıyla (`@eslint/eslintrc`) çakışıp "circular structure" hatasıyla çöken üst akış (upstream) bir hataya sahip — kural seti framework'ten bağımsız olduğu için bu bir sorun oluşturmaz. (2) `middleware.ts` kullanımdan kaldırılmak üzere ("deprecated", henüz kaldırılmadı) işaretlendi; Next'in resmi codemod'u git deposu istediğinden ve bu dosya admin yetkilendirme korumasını içerdiğinden, doğrulamadan elle tahmin ederek değiştirmedim — `git init` yaptıktan sonra `npx @next/codemod@canary middleware-to-proxy .` çalıştırılması önerilir.
- **Bağlantı havuzu (pooler) notu:** Supabase gibi pgbouncer tabanlı bir Postgres kullanıyorsanız `DATABASE_URL`'i transaction pooler'a, `DIRECT_URL`'i session/direct bağlantıya ayırın (yukarıdaki Kurulum bölümüne bakın) — aksi halde çoklu eşzamanlı bağlantıda "max clients reached" hatası alırsınız (bizzat karşılaşıp düzeltildi).
- **Testler eklendi:** 26 birim testi (slug, dedup/URL normalizasyonu, RBAC, HTML sanitize, SSRF koruması) — `npm test` ile bu ortamda gerçekten çalıştırıldı ve geçti. Playwright E2E testleri de yazıldı (yetkisiz admin erişimi engelleme, hatalı giriş, uçtan uca haber oluşturup yayınlama akışı) ancak bu geliştirme ortamında çalışan bir Docker daemon olmadığından **çalıştırılamadı** — yerelinizde `docker compose up -d postgres redis` ile veritabanını ayağa kaldırıp `npm run test:e2e` ile doğrulamanızı öneririz.
- **CI (GitHub Actions)** eklendi (`.github/workflows/ci.yml`): lint, typecheck, birim testleri, migration, build, seed ve E2E testlerini Postgres/Redis servisleriyle çalıştırır — bu workflow henüz gerçek bir GitHub Actions runner'ında tetiklenip doğrulanmadı.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Prodüksiyon build/çalıştırma |
| `npm run lint` / `npm run typecheck` | Statik kontroller |
| `npm run test` | Vitest (birim testler eklendikçe) |
| `npm run prisma:migrate` | Yeni migration oluştur |
| `npm run prisma:studio` | Veritabanını GUI ile görüntüle |
