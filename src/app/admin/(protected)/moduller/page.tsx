import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { getModuleFlags, MODULE_LABELS, type ModuleKey } from "@/server/services/moduleFlagsService";
import { updateModuleFlags } from "@/server/actions/moduleFlagsActions";
import Link from "next/link";
import { newsroomModules } from "@/lib/softwareRelease";

// Her aç/kapa modülü için kısa açıklama ve (varsa) yönetim sayfası bağlantısı.
const MODULE_META: Record<ModuleKey, { desc: string; href?: string }> = {
  comments: { desc: "Okuyucu yorumları ve onay kuyruğu.", href: "/admin/yorumlar" },
  polls: { desc: "Haberlere anket ekleme ve sonuç takibi.", href: "/admin/anketler" },
  push: { desc: "Tarayıcı push bildirim gönderimi.", href: "/admin/bildirimler" },
  socialAutoPost: { desc: "Yayınlanan haberi X, Facebook ve Telegram'a otomatik paylaşır.", href: "/admin/sosyal-otomasyon" },
  redirects: { desc: "Eski adresler için 301 yönlendirme yönetimi.", href: "/admin/yonlendirmeler" },
  weather: { desc: "Ana sayfada hava durumu bileşeni." },
  currency: { desc: "Ana sayfada döviz ve altın piyasa paneli." },
  aiAutoPublish: { desc: "Güvenilir kaynakları AI ile özgünleştirip SEO uyumlu şekilde doğrudan yayımlar.", href: "/admin/kaynaklar" },
};

export default async function AdminModulesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "modules:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const flags = await getModuleFlags();
  const keys = Object.keys(MODULE_LABELS) as ModuleKey[];
  const activeCount = keys.filter((k) => flags[k]).length;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-headline-l">Modüller</h1>
        <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Kurulu haber merkezi araçlarını açın, aç/kapa özelliklerini yönetin. {activeCount}/{keys.length} özellik açık.
        </p>
      </header>

      {/* Kurulu araçlar: ilgili yönetim sayfasına götüren kartlar */}
      <section aria-label="Kurulu haber merkezi araçları">
        <h2 className="mb-3 text-meta uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">Kurulu araçlar</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {newsroomModules.map((module, i) => (
            <Link
              href={module.href}
              key={`${module.title}-${i}`}
              className="group flex flex-col justify-between border border-line bg-transparent p-4 transition-colors hover:border-brand-red dark:border-line-dark"
            >
              <div>
                <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="my-2 font-serif text-headline-m">{module.title}</h3>
                <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{module.detail}</p>
              </div>
              <span className="mt-4 text-caption text-brand-red opacity-0 transition-opacity group-hover:opacity-100">Yönet →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Aç/Kapa modülleri: durum rozeti + açıklama + yönetim bağlantısı */}
      <section aria-label="Açılıp kapatılabilir modüller">
        <h2 className="mb-3 text-meta uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">Aç / Kapa modülleri</h2>
        <form action={updateModuleFlags} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((key) => {
              const on = flags[key];
              const meta = MODULE_META[key];
              return (
                <div key={key} className="flex items-start justify-between gap-4 border border-line p-4 dark:border-line-dark">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-headline-s">{MODULE_LABELS[key]}</span>
                      <span className={`text-meta uppercase tracking-wide ${on ? "text-green-600 dark:text-green-400" : "text-ink-secondary dark:text-ink-dark-secondary"}`}>
                        {on ? "● Açık" : "○ Kapalı"}
                      </span>
                    </div>
                    <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">{meta.desc}</p>
                    {meta.href && (
                      <Link href={meta.href} className="mt-2 inline-block text-caption text-brand-red hover:underline">
                        Ayarları yönet →
                      </Link>
                    )}
                  </div>
                  <label className="shrink-0 cursor-pointer">
                    <span className="sr-only">{MODULE_LABELS[key]} aç/kapa</span>
                    <input type="checkbox" name={key} defaultChecked={on} className="h-5 w-5" />
                  </label>
                </div>
              );
            })}
          </div>
          <button type="submit" className="bg-brand-red px-6 py-2.5 text-headline-s text-white hover:bg-brand-red-dark">
            Kaydet
          </button>
        </form>
      </section>
    </div>
  );
}
