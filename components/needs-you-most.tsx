'use client';

import { useMemo } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { formatTimeSince } from '@/lib/care-tracking';
import { getAnimalAvatar } from '@/lib/animal-avatar';
import type { Animal } from '@/lib/demo-data';

interface NeedsYouMostProps {
  animals: Animal[];
  onOpenProfile: (animal: Animal) => void;
}

/** Milliseconds since the most recent sign of care, or Infinity if never. */
function msSinceLastCare(animal: Animal): number {
  const stamps = [animal.last_seen, animal.last_fed, animal.last_cared_at]
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((value) => !Number.isNaN(value));

  if (stamps.length === 0) return Number.POSITIVE_INFINITY;
  return Date.now() - Math.max(...stamps);
}

/**
 * Surfaces the single animal who has gone longest without anyone checking in.
 *
 * The homepage already knows which animals are overdue, but it only ever said
 * so in a red banner listing names. One animal, one face, one action converts
 * that into something a student can actually do in the next ten minutes.
 */
export default function NeedsYouMost({ animals, onOpenProfile }: NeedsYouMostProps) {
  const animal = useMemo(() => {
    const candidates = animals.filter((a) => a.status === 'active');
    if (candidates.length === 0) return null;

    return candidates.reduce((worst, current) =>
      msSinceLastCare(current) > msSinceLastCare(worst) ? current : worst,
    );
  }, [animals]);

  if (!animal) return null;

  const gap = msSinceLastCare(animal);
  // Everyone has been seen recently — no guilt-trip needed.
  if (gap < 12 * 60 * 60 * 1000) return null;

  const lastCare = [animal.last_seen, animal.last_fed, animal.last_cared_at]
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => value !== null && !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return (
    <section className="px-4 mb-6">
      <button
        onClick={() => onOpenProfile(animal)}
        className="max-w-2xl mx-auto w-full text-left bg-white/80 dark:bg-card border-2 border-amber-200 rounded-3xl p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition flex items-center gap-4 group"
      >
        <img
          src={getAnimalAvatar(animal, 160)}
          alt=""
          aria-hidden="true"
          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-700 tracking-wide uppercase">Needs you most</p>
          <p className="text-lg font-bold text-foreground truncate">{animal.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
            <Clock size={12} className="flex-shrink-0" />
            {lastCare ? `Last checked on ${formatTimeSince(lastCare)}` : 'Nobody has checked in yet'}
            {animal.location ? ` · ${animal.location}` : ''}
          </p>
        </div>
        <ArrowRight
          size={20}
          className="text-amber-600 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        />
      </button>
    </section>
  );
}
