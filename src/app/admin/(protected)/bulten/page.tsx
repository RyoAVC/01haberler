import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ActionForm } from "@/components/admin/ActionForm";
import { createNewsletterDraft, sendNewsletterBatch } from "@/server/actions/newsletterActions";
import { CAMPAIGN_PREFIX, SUBSCRIBER_PREFIX, newsletterCampaignSchema, newsletterConfigured } from "@/server/services/newsletterService";
export default async function NewsletterAdmin() {
  const user = await getCurrentUser(); if (!user || !hasPermission(user.role, "push:manage")) return <p>Yetkiniz yok.</p>;
  const [campaigns, active, pending, news, deliveries] = await Promise.all([
    prisma.siteSetting.findMany({ where: { key: { startsWith: CAMPAIGN_PREFIX } }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.siteSetting.count({ where: { key: { startsWith: SUBSCRIBER_PREFIX }, value: { path: ["status"], equals: "ACTIVE" } } }),
    prisma.siteSetting.count({ where: { key: { startsWith: SUBSCRIBER_PREFIX }, value: { path: ["status"], equals: "PENDING" } } }),
    prisma.article.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date(), gte: new Date(Date.now() - 86400000) } }, orderBy: { publishedAt: "desc" }, take: 10, select: { title: true, excerpt: true, slug: true } }),
    prisma.siteSetting.findMany({ where: { key: { startsWith: "newsroom.delivery." } }, orderBy: { updatedAt: "desc" }, take: 30, select: { key: true, value: true, updatedAt: true } }),
  ]);
  const ready = newsletterConfigured();
  return <div className="space-y-6"><h1 className="font-serif text-headline-l">E-posta bülteni</h1><p>{active} doğrulanmış abone · {pending} doğrulama bekleyen</p><section className="module-card"><h2 className="font-serif text-headline-m">{ready ? "Sağlayıcı yapılandırılmış" : "Sağlayıcı kurulumu bekleniyor"}</h2><p className="mt-2">{ready ? "Gönderim yalnızca aşağıdaki açık editör onayıyla başlar. Yeni bülten hazırlamak kendiliğinden ileti göndermez." : "Hostinger ortam değişkenlerine RESEND_API_KEY ve doğrulanmış gönderen adresi NEWSLETTER_FROM eklenmeli. APP_URL üretimde HTTPS olmalı. Bu ekranda anahtar paylaşmayın."}</p></section>
    <ActionForm action={createNewsletterDraft}><h2 className="font-serif text-headline-m">Günlük özet hazırla</h2><label>Konu<input name="title" required minLength={5} maxLength={160} defaultValue={`01 Haberler · ${new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}`} /></label><label>İleti (son 24 saatin haberlerinden öneri)<textarea name="body" required minLength={20} maxLength={20000} rows={14} defaultValue={news.map(a => `${a.title}\n${a.excerpt}\n${env.APP_URL}/haber/${a.slug}`).join("\n\n")} /></label><p className="text-caption">Kaydedilen içerik değişmez. Düzeltme gerekiyorsa gönderimden önce yeni bir bülten hazırlayın.</p><button className="module-button">Gönderim için kaydet</button></ActionForm>
    <h2 className="font-serif text-headline-m">Son 20 bülten</h2>{campaigns.map(row => { const p = newsletterCampaignSchema.safeParse(row.value); if (!p.success) return null; return <section key={row.key} className="module-card"><h3 className="font-serif text-headline-m">{p.data.title}</h3><details className="my-4"><summary>İçeriği kontrol et</summary><p className="mt-3 whitespace-pre-line">{p.data.body}</p></details><ActionForm action={sendNewsletterBatch}><input type="hidden" name="key" value={row.key} /><label className="flex gap-2"><input type="checkbox" name="approved" required />İçeriği kontrol ettim; sıradaki en fazla 5 doğrulanmış aboneye gönderimi onaylıyorum.</label><button className="module-button" disabled={!ready}>Sonraki grubu gönder</button></ActionForm></section>; })}
    <p className="text-caption">Aynı bültenin aynı aboneye ikinci gönderimi kayıtla engellenir. Belirsiz yanıtlar otomatik denenmez; sağlayıcı loglarıyla incelenir. Bülten hazırlanırken doğrulanmış aboneler kapsanır.</p>
    <section className="module-card"><h2 className="font-serif text-headline-m">Son 30 gönderim kaydı</h2>{!deliveries.length && <p className="mt-3">Henüz gönderim yapılmadı.</p>}<ul className="mt-3 space-y-4 text-caption">{deliveries.map(row => { const data = row.value as { status?: string; externalId?: string }; return <li key={row.key}><strong>{data.status ?? "Bilinmiyor"}</strong> · {row.updatedAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}<code className="block break-all">{row.key}</code>{data.externalId && <span className="block">Sağlayıcı kayıt numarası: {data.externalId}</span>}</li>; })}</ul></section>
  </div>;
}
