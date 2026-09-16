"use client";

import { useState } from "react";
import type { LeagueFixtures } from "@/server/services/fixturesService";

export function FixturesTabs({ leagues }: { leagues: LeagueFixtures[] }) {
  const [activeId, setActiveId] = useState(leagues[0]?.leagueId);
  const active = leagues.find((l) => l.leagueId === activeId) ?? leagues[0];

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-line pb-2 dark:border-line-dark">
        {leagues.map((league) => (
          <button
            key={league.leagueId}
            type="button"
            onClick={() => setActiveId(league.leagueId)}
            className={`flex items-center gap-1.5 px-2 py-1 text-meta font-medium transition-colors ${
              league.leagueId === active?.leagueId
                ? "bg-brand-red text-white"
                : "text-ink-secondary hover:text-brand-red dark:text-ink-dark-secondary"
            }`}
          >
            {league.leagueBadge && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={league.leagueBadge} alt="" width={14} height={14} className="shrink-0" />
            )}
            {league.leagueName}
          </button>
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {active?.matches.length ? (
          active.matches.map((match) => (
            <li key={match.id} className="border-b border-line pb-3 last:border-0 dark:border-line-dark">
              <div className="mb-1.5 flex items-center justify-between text-meta text-ink-secondary dark:text-ink-dark-secondary">
                <span className="capitalize">{match.dateLabel}</span>
                {match.timeLabel && <span className="font-mono font-medium text-ink dark:text-ink-dark">{match.timeLabel}</span>}
              </div>
              <div className="flex items-center gap-1.5 text-headline-s">
                {match.homeBadge && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.homeBadge} alt="" width={16} height={16} className="shrink-0" />
                )}
                <span className="truncate">{match.homeTeam}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-headline-s">
                {match.awayBadge && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.awayBadge} alt="" width={16} height={16} className="shrink-0" />
                )}
                <span className="truncate">{match.awayTeam}</span>
              </div>
            </li>
          ))
        ) : (
          <li className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Bu lig için fikstür bilgisi bulunamadı.</li>
        )}
      </ul>
    </div>
  );
}
