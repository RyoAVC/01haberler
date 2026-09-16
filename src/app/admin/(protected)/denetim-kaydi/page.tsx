import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";

const ACTION_LABEL: Record<string, string> = {
  LOGIN: "Giriş yaptı",
  ARTICLE_CREATE: "Haber oluşturdu",
  ARTICLE_UPDATE: "Haber güncelledi",
  ARTICLE_APPROVE_PUBLISH: "Haberi onaylayıp yayınladı",
  ARTICLE_PUBLISH: "Haber yayınladı",
  ARTICLE_REJECT: "Haberi reddetti",
  ARTICLE_ARCHIVE: "Haberi arşivledi",
  ARTICLE_DELETE: "Haber sildi",
  SOURCE_CREATE: "Kaynak ekledi",
  FEED_CREATE: "Feed ekledi",
  CATEGORY_CREATE: "Kategori ekledi",
  TAG_CREATE: "Etiket ekledi",
  TAG_DELETE: "Etiket sildi",
  USER_CREATE: "Kullanıcı ekledi",
  USER_ACTIVATE: "Kullanıcıyı etkinleştirdi",
  USER_DEACTIVATE: "Kullanıcıyı devre dışı bıraktı",
  USER_ROLE_CHANGE: "Kullanıcı rolünü değiştirdi",
  AD_CREATE: "Reklam alanı ekledi",
  AD_ACTIVATE: "Reklamı yayına aldı",
  AD_DEACTIVATE: "Reklamı yayından kaldırdı",
  AD_DELETE: "Reklam alanı sildi",
};

export default async function AdminAuditLogPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "audit:view")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="font-serif text-headline-l">Denetim Kaydı</h1>
      <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">Son 200 işlem gösteriliyor.</p>

      <table className="mt-6 w-full text-headline-s">
        <thead>
          <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
            <th className="py-2 pr-4">Tarih</th>
            <th className="py-2 pr-4">Kullanıcı</th>
            <th className="py-2 pr-4">İşlem</th>
            <th className="py-2 pr-4">Nesne</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-line dark:border-line-dark">
              <td className="py-2 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">{formatDateTr(log.createdAt)}</td>
              <td className="py-2 pr-4">{log.user?.name ?? "Sistem"}</td>
              <td className="py-2 pr-4">{ACTION_LABEL[log.action] ?? log.action}</td>
              <td className="py-2 pr-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">
                {log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={4} className="py-3 text-ink-secondary dark:text-ink-dark-secondary">Henüz kayıt yok.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
