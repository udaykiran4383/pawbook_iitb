'use client';

import { getTrustBadge, badgeDetails } from '@/lib/trust-score';

interface TrustBadgeProps {
  score: number;
}

export default function TrustBadge({ score }: TrustBadgeProps) {
  const badge = getTrustBadge(score);
  const details = badgeDetails[badge];

  const getBadgeEmoji = (badge: string) => {
    switch (badge) {
      case 'verified':
        return '⭐';
      case 'standard':
        return '🐾';
      case 'new':
        return '✨';
      default:
        return '🐾';
    }
  };

  return (
    <div className="group relative inline-block">
      <button
        className="bg-white/80 hover:bg-white px-3 py-2 rounded-full flex items-center gap-2 text-sm font-semibold text-foreground transition hover:shadow-md scrapbook-card"
        title={details.description}
      >
        <span className="text-lg">{getBadgeEmoji(badge)}</span>
        <span className="text-xs handwritten">{details.label}</span>
      </button>

      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-foreground text-white text-xs rounded-xl shadow-lg p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
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
