import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLastNDaysStats, getTodayViewCount } from "@/server/services/dailyStatService";
import { getSeoScore } from "@/server/services/seoScoreService";
import { TrafficChart } from "@/components/admin/dashboard/TrafficChart";
import { CategoryDonut } from "@/components/admin/dashboard/CategoryDonut";
import { SeoScoreGauge } from "@/components/admin/dashboard/SeoScoreGauge";
import { EditorPerformanceTable } from "@/components/admin/dashboard/EditorPerformanceTable";
import { GoogleTrendsWidget } from "@/components/admin/dashboard/GoogleTrendsWidget";

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

async function getStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    published,
    pendingReview,
    drafts,
    scheduled,
    sources,
    failedJobs,
    pendingComments,
    scheduledToday,
    publishedToday,
    todayViews,
    trafficData,
    seoScore,
    categoryGroups,
    editorGroups,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "SCHEDULED" } }),
    prisma.source.count({ where: { isActive: true } }),
    prisma.ingestionJob.count({ where: { status: "FAILED" } }),
    prisma.comment.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.article.count({ where: { status: "SCHEDULED", scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.article.count({ where: { status: "PUBLISHED", publishedAt: { gte: todayStart, lte: todayEnd } } }),
    getTodayViewCount(),
    getLastNDaysStats(7),
    getSeoScore(),
    prisma.article.groupBy({ by: ["categoryId"], _count: true, where: { status: "PUBLISHED" } }),
    prisma.articleRevision.groupBy({
      by: ["editedById"],
      _count: true,
      where: { editedById: { not: null }, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const categoryIds = categoryGroups.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const categoryData = categoryGroups
    .map((g) => ({ name: categoryNameById.get(g.categoryId) ?? "Diğer", count: g._count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const editorUserIds = editorGroups.map((g) => g.editedById).filter((id): id is string => id !== null);
  const editorUsers = await prisma.user.findMany({ where: { id: { in: editorUserIds } }, select: { id: true, name: true, role: true } });
  const editorById = new Map(editorUsers.map((u) => [u.id, u]));
  const editorRows = editorGroups
    .filter((g) => g.editedById && editorById.has(g.editedById))
    .map((g) => {
      const user = editorById.get(g.editedById as string)!;
      return { userId: user.id, name: user.name, role: user.role, editCount: g._count };
    })
    .sort((a, b) => b.editCount - a.editCount)
    .slice(0, 10);

  return {
    published,
    pendingReview,
    drafts,
    scheduled,
    sources,
    failedJobs,
    pendingComments,
    scheduledToday,
    publishedToday,
    todayViews,
    trafficData,
    seoScore,
    categoryData,
    editorRows,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const mainCards = [
    { label: "Yayında", value: stats.published, href: "/admin/haberler?durum=PUBLISHED" },
    { label: "İncelemede", value: stats.pendingReview, href: "/admin/haberler?durum=PENDING_REVIEW" },
    { label: "Taslak", value: stats.drafts, href: "/admin/haberler?durum=DRAFT" },
    { label: "Zamanlanmış", value: stats.scheduled, href: "/admin/haberler?durum=SCHEDULED" },
  ];

  const quickStats = [
    { label: "Bekleyen Yorum", value: stats.pendingComments, href: "/admin/yorumlar" },
    { label: "Aktif Kaynak", value: stats.sources, href: "/admin/kaynaklar" },
    { label: "Başarısız Görev", value: stats.failedJobs, href: "/admin/kaynaklar" },
    { label: "Bugün Zamanlanan", value: stats.scheduledToday, href: "/admin/haberler?durum=SCHEDULED" },
    { label: "Bugün Yayınlanan", value: stats.publishedToday, href: "/admin/haberler?durum=PUBLISHED" },
    { label: "Bugün Görüntüleme", value: stats.todayViews, href: undefined },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-headline-l">Genel Bakış</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {mainCards.map((c) => (
          <Link key={c.label} href={c.href} className="border border-line bg-surface-raised p-4 hover:border-brand-red dark:border-line-dark dark:bg-surface-dark-raised">
            <p className="font-mono text-headline-l">{c.value}</p>
            <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {quickStats.map((c) =>
          c.href ? (
            <Link key={c.label} href={c.href} className="border border-line bg-surface-raised px-3 py-2 hover:border-brand-red dark:border-line-dark dark:bg-surface-dark-raised">
              <p className="font-mono text-headline-m">{c.value}</p>
              <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{c.label}</p>
            </Link>
          ) : (
            <div key={c.label} className="border border-line bg-surface-raised px-3 py-2 dark:border-line-dark dark:bg-surface-dark-raised">
              <p className="font-mono text-headline-m">{c.value}</p>
              <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{c.label}</p>
            </div>
          )
        )}
      </div>

      {stats.pendingReview > 0 && (
        <p className="border border-brand-red px-4 py-3 text-headline-s">
          {stats.pendingReview} haber inceleme bekliyor.{" "}
          <Link href="/admin/haberler?durum=PENDING_REVIEW" className="text-brand-red underline">
            İncele →
          </Link>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SeoScoreGauge score={stats.seoScore.score} issues={stats.seoScore.issues} />
        <GoogleTrendsWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line p-4 dark:border-line-dark">
          <h2 className="font-serif text-headline-m">7 Günlük Trafik</h2>
          <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Son 7 günün görüntülenme trendi</p>
          <div className="mt-3">
            <TrafficChart data={stats.trafficData} />
          </div>
        </section>

        <section className="border border-line p-4 dark:border-line-dark">
          <h2 className="font-serif text-headline-m">Kategori Dağılımı</h2>
          <div className="mt-3">
            <CategoryDonut data={stats.categoryData} />
          </div>
        </section>
      </div>

      <section className="border border-line p-4 dark:border-line-dark">
        <h2 className="font-serif text-headline-m">Editör Performansı</h2>
        <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Son 30 günün en aktif editörleri</p>
        <div className="mt-3">
          <EditorPerformanceTable rows={stats.editorRows} />
        </div>
      </section>
    </div>
  );
}
