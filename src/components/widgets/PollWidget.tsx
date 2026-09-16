"use client";

import { useState } from "react";
import { submitPollVoteAction } from "@/server/actions/pollActions";

interface PollOption {
  id: string;
  label: string;
  _count: { votes: number };
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export function PollWidget({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalVotes = poll.options.reduce((sum, o) => sum + o._count.votes, 0);

  async function handleVote(optionId: string) {
    const result = await submitPollVoteAction(poll.id, optionId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setVoted(true);
  }

  return (
    <div className="border border-line p-4 dark:border-line-dark">
      <h3 className="font-serif text-headline-m">{poll.question}</h3>
      <div className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0;
          return voted ? (
            <div key={option.id} className="relative border border-line px-3 py-2 text-headline-s dark:border-line-dark">
              <div className="absolute inset-y-0 left-0 bg-brand-red/10" style={{ width: `${pct}%` }} />
              <span className="relative">{option.label} — %{pct}</span>
            </div>
          ) : (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              className="block w-full border border-line px-3 py-2 text-left text-headline-s hover:bg-surface-dark/5 dark:border-line-dark dark:hover:bg-white/5"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-caption text-brand-red">{error}</p>}
    </div>
  );
}
