import { getWeeklyFixtures } from "@/server/services/fixturesService";
import { FixturesTabs } from "@/components/widgets/FixturesTabs";

export async function FixturesWidget() {
  const leagues = await getWeeklyFixtures();
  const hasAnyMatch = leagues.some((l) => l.matches.length > 0);
  if (!hasAnyMatch) return null;

  return (
    <section aria-label="Haftalık Fikstür" className="border border-line p-4 dark:border-line-dark">
      <h2 className="mb-3 font-serif text-headline-m">Haftalık Fikstür</h2>
      <FixturesTabs leagues={leagues} />
    </section>
  );
}
