import { NewsRail } from "@/components/home/NewsRail";
import Link from "next/link";
import { HomeDiscovery } from "@/components/newsroom/HomeDiscovery";
import { mediaFocus } from "@/lib/utils/mediaFocus";
import { activeHeadlineIds } from "@/lib/utils/headlineSchedule";
import { HeroCard } from "@/components/article/HeroCard";
import { LatestNewsTicker } from "@/components/layout/LatestNewsTicker";
import { FixturesWidget } from "@/components/widgets/FixturesWidget";
import { HomeHeadline } from "@/components/home/HomeHeadline";
import { BrandCampaign } from "@/components/ads/BrandCampaign";
import { MarketBoard } from "@/components/widgets/MarketBoard";
import { getMarketSnapshot } from "@/server/services/marketService";
import { getHomeSettings } from "@/server/services/homeSettingsService";
import { PUBLIC_ARTICLE_CARD_SELECT } from "@/server/services/articleService";
import { CompactListItem } from "@/components/article/CompactListItem";
import { SideImageItem } from "@/components/article/SideImageItem";
import { GalleryCard } from "@/components/article/GalleryCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { PollWidget } from "@/components/widgets/PollWidget";
import {
  getLatestArticles,
  getFeaturedArticles,
  getMostRead,
  getArticlesByCategorySlugForHome,
} from "@/server/services/articleService";
import { getActivePoll } from "@/server/services/pollService";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { prisma } from "@/lib/db";
import { isEditorialArticle, selectHeadlines, selectPinnedHeadlines } from "@/lib/utils/headlines";

export const dynamic = "force-dynamic";

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between rule-bottom pb-2">
      <h2 className="font-serif text-headline-l">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center text-headline-s text-brand-red hover:underline">
          Tümü <ChevronRightIcon width={16} height={16} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [featured, latest, mostRead, gundem, dunya, ekonomi, teknoloji, spor, adana, adanaCategory, pollsEnabled] =
    await Promise.all([
      getFeaturedArticles(4),
      getLatestArticles(6),
      getMostRead(7),
      getArticlesByCategorySlugForHome("gundem", 6),
      getArticlesByCategorySlugForHome("dunya", 4),
      getArticlesByCategorySlugForHome("ekonomi", 6),
      getArticlesByCategorySlugForHome("teknoloji", 4),
      getArticlesByCategorySlugForHome("spor", 3),
      getArticlesByCategorySlugForHome("adana", 4),
      prisma.category.findUnique({ where: { slug: "adana" } }),
      isModuleEnabled("polls"),
    ]);

  const activePoll = pollsEnabled ? await getActivePoll() : null;

  const homeSettings = await getHomeSettings();
  homeSettings.headlineIds = activeHeadlineIds(homeSettings.headlineIds, homeSettings.windows);
  const pinned = homeSettings.headlineIds.length ? await prisma.article.findMany({ where: { id: { in: homeSettings.headlineIds }, status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: PUBLIC_ARTICLE_CARD_SELECT }) : [];
  pinned.sort((a, b) => homeSettings.headlineIds.indexOf(a.id) - homeSettings.headlineIds.indexOf(b.id));
  const heroArticles = selectPinnedHeadlines(homeSettings.headlineIds, pinned, selectHeadlines(latest, featured, 10));
  const mainHero = heroArticles[0];
  const heroMedia = await prisma.media.findMany({ where: { url: { in: heroArticles.flatMap(a => a.coverMedia ? [a.coverMedia.url] : []) } }, select: { id: true, url: true }, take: 10 });
  const heroFocus = await prisma.siteSetting.findMany({ where: { key: { in: heroMedia.map(m => `media_metadata_${m.id}`) } }, select: { key: true, value: true } });
  const focusFor = (url?: string) => mediaFocus(heroFocus.find(s => s.key === `media_metadata_${heroMedia.find(m => m.url === url)?.id}`)?.value);
  const secondaryHero = heroArticles.slice(1, 3);
  const market = await isModuleEnabled("currency") ? await getMarketSnapshot() : null;

  return (
    <div className="home-stage">
    <><aside className="home-rail home-rail-left" aria-label="Haber kısayolları"><NewsRail side="left" articles={latest.filter(isEditorialArticle)} />{homeSettings.campaignsEnabled && <BrandCampaign brand="avci" compact />}</aside>
    <aside className="home-rail home-rail-right" aria-label="Okur gündemi"><NewsRail side="right" articles={mostRead.filter(isEditorialArticle)} />{homeSettings.campaignsEnabled && <BrandCampaign brand="adana" compact />}</aside></>
    <div className="container-page home-canvas py-6">
      <h1 className="sr-only">01 Haberler — Günün manşetleri</h1>
      {mainHero && (
        <section aria-label="Manşetler" className={`home-headlines ${secondaryHero.length ? "has-secondary" : ""}`}>
          <HomeHeadline article={mainHero} primary focus={focusFor(mainHero.coverMedia?.url)} />
          {secondaryHero.length > 0 && <div className="secondary-headlines">
            {secondaryHero.map((a) => (
              <HomeHeadline key={a.id} article={a} focus={focusFor(a.coverMedia?.url)} />
            ))}
          </div>}
        </section>
      )}

      <div className="my-5"><LatestNewsTicker /></div>
      {market && <MarketBoard initial={market} />}
      {latest.some((article) => Boolean(article.coverMedia)) && <section className="home-live-feed" aria-label="Günün haber akışı">
        <div className="home-live-feed-heading"><div><span className="eyebrow">GÜNÜN AKIŞI</span><h2>Şimdi gündemde</h2></div><Link href="/son-haberler">Tüm son haberler →</Link></div>
        <div className="home-live-feed-grid">{latest.filter((article) => Boolean(article.coverMedia)).slice(0, 6).map((article) => <SideImageItem key={article.id} article={article} />)}</div>
      </section>}
      {homeSettings.campaignsEnabled && <div className="home-campaign-strip"><BrandCampaign brand="avci" compact /><BrandCampaign brand="adana" compact /></div>}

      <AdSlot placement="HOME_BELOW_HERO" eager />
      <HomeDiscovery />
<nav className="home-category-index" aria-label="Ana sayfa kategori bölümleri">{([["gundem", "Gündem", gundem], ["dunya", "Dünya", dunya], ["ekonomi", "Ekonomi", ekonomi], ["teknoloji", "Teknoloji", teknoloji], ["spor", "Spor", spor]] as const).filter(([, , items]) => items.length > 0).map(([slug, label]) => <Link key={String(slug)} href={`#bolum-${slug}`}>{String(label)} <span aria-hidden="true">↓</span></Link>)}</nav>

      <div className="grid gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-10">
          {gundem.length > 0 && (
            <section id="bolum-gundem" aria-label="Gündem" className="editorial-section">
              <SectionHeading title="Gündem" href="/kategori/gundem" />
              <ul>
                {gundem.map((a) => (
                  <CompactListItem key={a.id} article={a} />
                ))}
              </ul>
            </section>
          )}

          {dunya.length > 0 && (
            <section id="bolum-dunya" aria-label="Dünya" className="editorial-section">
              <SectionHeading title="Dünya" href="/kategori/dunya" />
              <div>
                {dunya.map((a) => (
                  <SideImageItem key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          <AdSlot placement="IN_FEED" />

          {ekonomi.length > 0 && (
            <section id="bolum-ekonomi" aria-label="Ekonomi" className="editorial-section">
              <SectionHeading title="Ekonomi" href="/kategori/ekonomi" />
              <ul>
                {ekonomi.map((a) => (
                  <CompactListItem key={a.id} article={a} />
                ))}
              </ul>
            </section>
          )}

          {teknoloji.length > 0 && (
            <section id="bolum-teknoloji" aria-label="Teknoloji">
              <SectionHeading title="Teknoloji" href="/kategori/teknoloji" />
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {teknoloji.map((a) => (
                  <GalleryCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          {spor.length > 0 && (
            <section id="bolum-spor" aria-label="Spor">
              <SectionHeading title="Spor" href="/kategori/spor" />
              <div>
                {spor.map((a) => (
                  <SideImageItem key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          {adanaCategory && adana.length > 0 && (
            <section aria-label="Adana'dan haberler" className="border-l-2 border-brand-red pl-4">
              <SectionHeading title="Adana'dan Haberler" href="/kategori/adana" />
              <div className="grid gap-6 sm:grid-cols-2">
                <HeroCard article={adana[0]!} />
                <ul>
                  {adana.slice(1).map((a) => (
                    <CompactListItem key={a.id} article={a} />
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          <section aria-label="En çok okunanlar" className="most-read-panel">
            <SectionHeading title="En Çok Okunanlar" />
            <ol>
              {mostRead.filter(isEditorialArticle).slice(0, 6).map((a, i) => (
                <li key={a.id} className="flex gap-3 border-b border-line py-3 last:border-0 dark:border-line-dark">
                  <span className="font-serif text-headline-l text-line dark:text-line-dark">{i + 1}</span>
                  <Link href={`/haber/${a.slug}`} className="line-clamp-2 text-headline-s hover:text-brand-red">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <FixturesWidget />
          {activePoll && <PollWidget poll={activePoll} />}

          <AdSlot placement="SIDEBAR" eager />
        </aside>
      </div>
    </div></div>
  );
}
