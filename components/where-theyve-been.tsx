'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { formatTimeSince } from '@/lib/care-tracking';
import { absencesOf, describeRange, sightingsOf, zoneSummary, type Sighting } from '@/lib/sightings';
import type { Animal } from '@/lib/demo-data';

interface WhereTheyveBeenProps {
  animal: Pick<Animal, 'sightings' | 'location'>;
  /** Show the raw recent log as well as the summary. */
  showLog?: boolean;
}

const KIND_LABEL: Record<Sighting['kind'], string> = {
  seen: 'seen',
  fed: 'fed',
  treated: 'given care',
  sheltered: 'sheltered',
  observation: 'surveyed',
  emergency: 'reported',
  not_found: 'looked, not found',
};

/**
 * Movement over time, as zones and shares — never as points.
 *
 * A frequency table of zones is the strongest claim a few dozen sightings can
 * support, and it happens to be the form that is safe to show: "usually near
 * H11" tells a student where to look and tells nobody where to aim.
 */
export default function WhereTheyveBeen({ animal, showLog = false }: WhereTheyveBeenProps) {
  const sightings = sightingsOf(animal);
  const absences = absencesOf(animal);
  const zones = useMemo(() => zoneSummary(sightings, 4), [sightings]);
  const range = useMemo(() => describeRange(sightings), [sightings]);

  if (sightings.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <MapPin size={15} />
          Where they&apos;ve been
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          No sightings logged yet. Home area: <span className="font-bold">{animal.location || 'unknown'}</span>.
          Every feed, survey or &ldquo;I saw them&rdquo; adds one.
        </p>
      </div>
    );
  }

  const max = zones[0]?.count ?? 1;

  return (
    <div className="bg-white/70 dark:bg-card border border-border rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <MapPin size={15} />
          Where they&apos;ve been
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {range} · {sightings.length - absences.length} sighting{sightings.length - absences.length === 1 ? '' : 's'}
          {absences.length > 0 && ` · looked and not found ${absences.length}×`}
        </p>
      </div>

      <ul className="space-y-1.5" aria-label="Zones by number of sightings">
        {zones.map((z) => (
          <li key={z.zone} className="text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-foreground truncate">{z.zone}</span>
              <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                {z.count} · last {formatTimeSince(new Date(z.lastAt))}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden" aria-hidden="true">
              <div className="h-full bg-foreground/60 rounded-full" style={{ width: `${(z.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      {showLog && (
        <ul className="border-t border-border pt-2 space-y-1 max-h-40 overflow-y-auto pr-1" aria-label="Recent sightings">
          {sightings.slice(0, 20).map((s) => (
            <li key={s.id} className="text-[11px] text-muted-foreground flex justify-between gap-2">
              <span className="truncate">
                <span className="text-foreground">{KIND_LABEL[s.kind] ?? s.kind}</span> at {s.zone}
                {s.by ? ` · ${s.by}` : ''}
              </span>
              <span className="whitespace-nowrap tabular-nums" suppressHydrationWarning>
                {formatTimeSince(new Date(s.at))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
