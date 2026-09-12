'use client';

import { getTrustBadge, badgeDetails } from '@/lib/trust-score';

interface TrustBadgeProps {
  score: number;
}

export default function TrustBadge({ score }: TrustBadgeProps) {
  const badge = getTrustBadge(score);
  const details = badgeDetails[badge];

  // getTrustBadge returns gold | silver | bronze | novice. This switch used to
  // test for 'verified' | 'standard' | 'new', which those values never match,
  // so every badge silently fell through to the default paw.
  const badgeEmoji: Record<string, string> = {
    gold: '⭐',
    silver: '🥈',
    bronze: '🐾',
    novice: '✨',
  };

  return (
    <div className="group relative inline-block">
      <button
        type="button"
        className="bg-white/80 dark:bg-card hover:bg-white px-3 py-2 rounded-full flex items-center gap-2 text-sm font-semibold text-foreground transition hover:shadow-md scrapbook-card"
        title={details.description}
        aria-label={`${details.label}. ${details.description}. Trust score ${score} out of 100.`}
      >
        <span className="text-lg" aria-hidden="true">{badgeEmoji[badge] ?? '🐾'}</span>
        <span className="text-xs handwritten">{details.label}</span>
      </button>

      {/* Tooltip */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-foreground text-background text-xs rounded-xl shadow-lg p-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition pointer-events-none z-10"
      >
        <p className="font-semibold mb-1">{details.label}</p>
        <p className="text-accent-foreground/80">{details.description}</p>
        <p className="text-muted-foreground mt-2">Trust: {score}/100</p>
        <div className="mt-2 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-accent h-full transition-all"
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
