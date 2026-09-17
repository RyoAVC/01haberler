import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";
import { prisma } from "@/lib/db";
import { saveSocialAutoPostConfig, saveSocialRules } from "@/server/actions/socialConfigActions";
import { getSocialRules } from "@/server/services/socialRulesService";
import type { SocialPlatform } from "@prisma/client";

const PLATFORMS: SocialPlatform[] = ["TELEGRAM", "X", "FACEBOOK"];
const PLATFORM_LABEL: Record<SocialPlatform, string> = { TELEGRAM: "Telegram", X: "X (Twitter)", FACEBOOK: "Facebook" };

export default async function AdminSocialAutomationPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "social:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const [configs, logs, categories, rules] = await Promise.all([
    prisma.socialAutoPostConfig.findMany(),
    prisma.socialPostLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { article: { select: { title: true } } } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getSocialRules(),
  ]);
  const configByPlatform = new Map(configs.map((c) => [c.platform, c]));

  return (
    <div>
      <h1 className="font-serif text-headline-l">Sosyal Medya Otomasyonu</h1>
      <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Bir haber yayınlandığında seçili platformlara otomatik paylaşım yapılır. Telegram (bot token), X (OAuth2 kullanıcı jetonu) ve Facebook (Sayfa erişim jetonu + Sayfa ID) desteklenir. Aynı haber bir platforma yalnızca bir kez gönderilir.
      </p>

      <section className="mt-6 border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Paylaşım Kuralları</h2>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Sessiz saat aralığında paylaşım yapılmaz. Kategori seçilirse yalnızca o kategorilerdeki haberler paylaşılır (boş bırakılırsa tümü).
        </p>
        <form action={saveSocialRules} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-headline-s">
            Sessiz saat başlangıcı (0-23)
            <input type="number" name="quietStartHour" min={0} max={23} defaultValue={rules.quietStartHour ?? ""} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </label>
          <label className="text-headline-s">
            Sessiz saat bitişi (0-23)
            <input type="number" name="quietEndHour" min={0} max={23} defaultValue={rules.quietEndHour ?? ""} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </label>
          <label className="text-headline-s sm:col-span-2">
            İzin verilen kategoriler (boş = tümü)
            <select name="allowedCategoryIds" multiple defaultValue={rules.allowedCategoryIds} className="mt-1 h-32 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2 sm:w-fit">Kuralları Kaydet</button>
        </form>
      </section>

      <div className="mt-6 space-y-6">
        {PLATFORMS.map((platform) => {
          const config = configByPlatform.get(platform);
          return (
            <section key={platform} className="border border-line p-4 dark:border-line-dark">
              <h2 className="font-serif text-headline-m">{PLATFORM_LABEL[platform]}</h2>
              <form action={saveSocialAutoPostConfig.bind(null, platform)} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  name="accessToken"
                  placeholder={platform === "TELEGRAM" ? "Bot Token" : "Access Token"}
                  defaultValue={config?.accessToken ?? ""}
                  className="border border-line bg-transparent px-3 py-2 dark:border-line-dark"
                />
                <input
                  name="accountRef"
                  placeholder={platform === "TELEGRAM" ? "Chat ID" : "Hesap/Sayfa ID"}
                  defaultValue={config?.accountRef ?? ""}
                  className="border border-line bg-transparent px-3 py-2 dark:border-line-dark"
                />
                <input
                  name="messageTemplate"
                  defaultValue={config?.messageTemplate ?? "{{title}} {{url}}"}
                  className="border border-line bg-transparent px-3 py-2 sm:col-span-2 dark:border-line-dark"
                />
                <label className="flex items-center gap-2 text-headline-s sm:col-span-2">
                  <input type="checkbox" name="isActive" defaultChecked={config?.isActive} className="h-4 w-4" /> Aktif
                </label>
                <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:col-span-2 sm:w-fit">Kaydet</button>
              </form>
            </section>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-headline-m">Son Paylaşımlar</h2>
        <table className="mt-3 w-full text-headline-s">
          <thead>
            <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
              <th className="py-2 pr-4">Haber</th>
              <th className="py-2 pr-4">Platform</th>
              <th className="py-2 pr-4">Durum</th>
              <th className="py-2 pr-4">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-line dark:border-line-dark">
                <td className="max-w-xs truncate py-2 pr-4">{log.article.title}</td>
                <td className="py-2 pr-4">{PLATFORM_LABEL[log.platform]}</td>
                <td className="py-2 pr-4">{log.status === "SUCCESS" ? "Başarılı" : log.errorMessage}</td>
                <td className="py-2 pr-4 text-caption">{formatDateTr(log.createdAt)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-ink-secondary dark:text-ink-dark-secondary">Henüz paylaşım yok.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
