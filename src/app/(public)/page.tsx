import Link from "next/link";
import { HeroCard } from "@/components/article/HeroCard";
import { LatestNewsTicker } from "@/components/layout/LatestNewsTicker";
import { FixturesWidget } from "@/components/widgets/FixturesWidget";
import { SecondaryHeadline } from "@/components/article/SecondaryHeadline";
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
import { isEditorialArticle, selectHeadlines } from "@/lib/utils/headlines";

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

  const heroArticles = selectHeadlines(featured, latest);
  const mainHero = heroArticles[0];
  const secondaryHero = heroArticles.slice(1, 4);

  return (
    <div className="container-page py-6">
      <div className="mb-6">
        <LatestNewsTicker />
      </div>

      {mainHero && (
        <section aria-label="Manşetler" className={`grid gap-8 pb-8 ${secondaryHero.length ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
          <HeroCard article={mainHero} />
          {secondaryHero.length > 0 && <div className="flex flex-col gap-3">
            {secondaryHero.map((a, i) => (
              <SecondaryHeadline key={a.id} article={a} showRule={i > 0} />
            ))}
          </div>}
        </section>
      )}

      <AdSlot placement="HOME_BELOW_HERO" eager />

      <div className="grid gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-10">
          {gundem.length > 0 && (
            <section aria-label="Gündem">
              <SectionHeading title="Gündem" href="/kategori/gundem" />
              <ul>
                {gundem.map((a) => (
                  <CompactListItem key={a.id} article={a} />
                ))}
              </ul>
            </section>
          )}

          {dunya.length > 0 && (
            <section aria-label="Dünya">
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
            <section aria-label="Ekonomi">
              <SectionHeading title="Ekonomi" href="/kategori/ekonomi" />
              <ul>
                {ekonomi.map((a) => (
                  <CompactListItem key={a.id} article={a} />
                ))}
              </ul>
            </section>
          )}

          {teknoloji.length > 0 && (
            <section aria-label="Teknoloji">
              <SectionHeading title="Teknoloji" href="/kategori/teknoloji" />
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {teknoloji.map((a) => (
                  <GalleryCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          {spor.length > 0 && (
            <section aria-label="Spor">
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
          <section aria-label="En çok okunanlar">
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
    </div>
  );
}
