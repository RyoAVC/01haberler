export const softwareRelease = {
  version: "1.10.0",
  title: "Gelişmiş manşet planlayıcı",
  date: "2026-09-17",
  items: [
    "Haber havuzundan birincil ve iki ikincil manşet alanına sürükle-bırak; dokunmatik/klavye için yerleştirme düğmeleri.",
    "Manşet kartlarını zamanlarıyla birlikte sıralama, Türkiye saatine göre başlangıç ve bitiş.",
    "Mobil ve masaüstü yerleşim önizlemesi; seçilen zamandaki otomatik alternatifleri görme.",
    "Süresi dolan veya henüz başlamayan seçim yerine en yeni yayındaki haber; manşet grubunda tekrar engeli.",
    "Sunucuda yetki, yayın durumu, mükerrer seçim ve tarih doğrulaması; ayar ayrıntılarıyla atomik işlem günlüğü.",
    "Kayıt sırasında çift gönderim engeli; hata halinde formu koruyan açıklama ve başarı bildirimi.",
  ],
};
export const newsroomModules = [
  { title: "Yayın kalite kontrolü", href: "/admin/haberler", detail: "Başlık, spot, görsel, kaynak ve tarih uyarıları" },
  { title: "Manşet planlayıcı", href: "/admin/vitrin", detail: "Yayın aralığı, sıralama, önizleme ve otomatik alternatif" },
  { title: "Medya merkezi", href: "/admin/medya", detail: "Arama, kaynak/hak notları, odak noktası" },
  { title: "Operasyon merkezi", href: "/admin/operasyon", detail: "Kaynak işleri, cron sağlığı ve yapılandırma durumu" },
  { title: "Konu dosyaları", href: "/admin/dosyalar", detail: "Özet, ilgili haberler, kişi ve kurumlar" },
  { title: "Yazar profilleri", href: "/admin/yazarlar", detail: "Biyografi, uzmanlık ve haber listesi" },
  { title: "Canlı anlatım", href: "/admin/dosyalar", detail: "Saatli gelişmeler, sabitleme, düzeltme ve bağlantı" },
  { title: "Yerel haber merkezi", href: "/admin/dosyalar", detail: "Şehir ve ilçe dosyaları" },
  { title: "Kaydedilenler ve takip", href: "/takip", detail: "Cihazda okuma listesi ve konu/yazar takibi" },
  { title: "İhbar ve düzeltme", href: "/admin/basvurular", detail: "Başvuru numarası, moderasyon ve iç notlar" },
  { title: "E-posta bülteni", href: "/admin/bulten", detail: "Sağlayıcı bağlantısından sonra doğrulanmış abonelik ve gönderim" },
  { title: "AI editör yardımcısı", href: "/admin/haberler", detail: "Yapılandırılmış sağlayıcıyla editör onaylı öneriler" },
];
