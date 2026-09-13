/**
 * Sterilisation and rabies coverage across the animals PawBook knows about.
 *
 * These are the two numbers every serious street-animal programme reports —
 * Alley Cat Allies, Soi Dog, Japan's Adachi ward — and the ones a Dean's office
 * or a court will read first. They are computed only from confirmed medical
 * records, never from an ear notch (see lib/survey.ts for why).
 *
 * The denominator is always stated. PawBook covers roughly 4% of the dogs on
 * campus, so "78% sterilised" means "of the animals on PawBook", not of IIT
 * Bombay, and the UI must never let those two be confused.
 */

import type { Animal } from './demo-data';

/** WHO/OIE: a rabies vaccination is considered current for one year. */
export const RABIES_CURRENT_DAYS = 365;

export interface Coverage {
  denominator: number;
  sterilised: number;
  rabiesCurrent: number;
  rabiesEver: number;
  /** 0–100, or null when there is nothing to divide by. */
  sterilisedPct: number | null;
  rabiesCurrentPct: number | null;
}

function recordDate(record: any): number | null {
  const raw = record?.record_date ?? record?.date ?? record?.created_at;
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

function isSterilisation(record: any): boolean {
  const text = `${record?.title ?? ''} ${record?.type ?? ''} ${record?.record_type ?? ''} ${record?.description ?? ''}`.toLowerCase();
  return /steril|spay|neuter|castrat|\babc\b/.test(text);
}

function isRabiesVaccination(record: any): boolean {
  const text = `${record?.title ?? ''} ${record?.type ?? ''} ${record?.record_type ?? ''} ${record?.description ?? ''}`.toLowerCase();
  // record_type 'vaccination' plus any mention of rabies is enough.
  return /rabies|anti-rabies|\barv\b/.test(text) && /vaccin|shot|dose|booster/.test(text);
}

export function getCoverage(animals: Pick<Animal, 'status' | 'medical_records'>[], now = Date.now()): Coverage {
  // Living animals only: coverage of the dead is not a health metric.
  const living = animals.filter((a) => a.status !== 'deceased');
  let sterilised = 0;
  let rabiesEver = 0;
  let rabiesCurrent = 0;

  for (const animal of living) {
    const records = Array.isArray(animal.medical_records) ? animal.medical_records : [];
    if (records.some(isSterilisation)) sterilised += 1;

    const rabiesDates = records.filter(isRabiesVaccination).map(recordDate).filter((d): d is number => d !== null);
    if (rabiesDates.length > 0) {
      rabiesEver += 1;
      const latest = Math.max(...rabiesDates);
      if (now - latest <= RABIES_CURRENT_DAYS * 86_400_000) rabiesCurrent += 1;
    }
  }

  const n = living.length;
  const pct = (k: number) => (n === 0 ? null : Math.round((k / n) * 100));
  return {
    denominator: n,
    sterilised,
    rabiesCurrent,
    rabiesEver,
    sterilisedPct: pct(sterilised),
    rabiesCurrentPct: pct(rabiesCurrent),
  };
}
