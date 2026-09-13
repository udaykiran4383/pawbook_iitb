'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import type { Animal } from '@/lib/demo-data';
import { LIFECYCLE, lifecycleCounts } from '@/lib/lifecycle';
import { getCoverage } from '@/lib/coverage';

interface CampusCensusProps {
  animals: Animal[];
}

/**
 * One line of census and two coverage figures.
 *
 * The denominator is printed every time. PawBook knows about a small fraction
 * of the animals on campus, and "78% sterilised" is a true statement about the
 * animals on PawBook and a false one about IIT Bombay; the label has to make
 * that impossible to misread, especially since these are the numbers a Dean or
 * a court would quote.
 */
export default function CampusCensus({ animals }: CampusCensusProps) {
  const counts = useMemo(() => lifecycleCounts(animals), [animals]);
  const coverage = useMemo(() => getCoverage(animals), [animals]);

  if (animals.length === 0) return null;

  const order: Array<keyof typeof LIFECYCLE> = ['active', 'missing', 'adopted', 'deceased'];

  return (
    <section className="px-4 mb-6">
      <div className="max-w-2xl mx-auto bg-white/80 dark:bg-card border border-amber-200 dark:border-border rounded-3xl p-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-sm">
          {order.map((status) =>
            counts[status] > 0 ? (
              <li key={status} className="text-foreground">
                <span aria-hidden="true">{LIFECYCLE[status].emoji}</span>{' '}
                <span className="font-bold tabular-nums">{counts[status]}</span>{' '}
                <span className="text-muted-foreground">{LIFECYCLE[status].label.toLowerCase()}</span>
              </li>
            ) : null,
          )}
        </ul>

        {coverage.denominator > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {coverage.sterilisedPct === null ? '—' : `${coverage.sterilisedPct}%`}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                sterilised
                <br />
                <span className="opacity-80">
                  {coverage.sterilised} of {coverage.denominator} on PawBook
                  {coverage.sterilised > 0 && ` · ${coverage.sterilisedVerified} verified`}
                </span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {coverage.rabiesCurrentPct === null ? '—' : `${coverage.rabiesCurrentPct}%`}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                rabies shot in the last year
                <br />
                <span className="opacity-80">
                  {coverage.rabiesCurrent} of {coverage.denominator} on PawBook
                  {coverage.rabiesCurrent > 0 && ` · ${coverage.rabiesCurrentVerified} verified`}
                </span>
              </p>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
          Counted from confirmed medical records only — an ear notch is not counted. PawBook
          knows a small share of the animals on campus; these are not campus-wide figures.
        </p>

        <div className="text-center mt-3">
          <Link
            href="/rules"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline"
          >
            <BookOpen size={13} />
            How we care for campus animals
          </Link>
        </div>
      </div>
    </section>
  );
}
