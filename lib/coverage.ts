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
  /** Subset of `sterilised` whose record came from the PHO or an AWO certificate. */
  sterilisedVerified: number;
  rabiesCurrent: number;
  rabiesCurrentVerified: number;
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

/**
 * Welfare indicators, from the survey observations rather than vet records.
 *
 * The one rigorous free-roaming-dog welfare study in the Chinese-speaking world
 * (Taiwan, 2019) published lameness, skin-disease and body-condition rates
 * explicitly "to earn public support". A campus divided on its animals is
 * persuaded by "3% thin, 7% with skin trouble, 92% vaccinated", not by a
 * count. These only mean anything relative to how many animals have actually
 * been surveyed, so that denominator is returned and must be shown.
 */
export interface Welfare {
  surveyed: number;
  thin: number;
  hairLoss: number;
  wound: number;
  ectoparasites: number;
}

export function getWelfare(animals: Pick<Animal, 'status' | 'observation'>[]): Welfare {
  const living = animals.filter((a) => a.status !== 'deceased');
  const surveyed = living.filter((a) => a.observation && Object.keys(a.observation).some((k) => k !== 'observed_at'));
  const count = (pred: (o: NonNullable<Animal['observation']>) => boolean) =>
    surveyed.filter((a) => pred(a.observation!)).length;
  return {
    surveyed: surveyed.length,
    thin: count((o) => o.body_condition === 'thin'),
    hairLoss: count((o) => Boolean(o.hair_loss)),
    wound: count((o) => Boolean(o.visible_wound)),
    ectoparasites: count((o) => Boolean(o.ectoparasites)),
  };
}

export function getCoverage(animals: Pick<Animal, 'status' | 'medical_records'>[], now = Date.now()): Coverage {
  // Living animals only: coverage of the dead is not a health metric.
  const living = animals.filter((a) => a.status !== 'deceased');
  let sterilised = 0;
  let sterilisedVerified = 0;
  let rabiesEver = 0;
  let rabiesCurrent = 0;
  let rabiesCurrentVerified = 0;
  const verified = (r: any) => r?.source === 'pho_record' || r?.source === 'awo_certificate';

  for (const animal of living) {
    const records = Array.isArray(animal.medical_records) ? animal.medical_records : [];
    const ster = records.filter(isSterilisation);
    if (ster.length) sterilised += 1;
    if (ster.some(verified)) sterilisedVerified += 1;

    const rabies = records.filter(isRabiesVaccination);
    const rabiesDates = rabies.map(recordDate).filter((d): d is number => d !== null);
    if (rabiesDates.length > 0) {
      rabiesEver += 1;
      const latest = Math.max(...rabiesDates);
      if (now - latest <= RABIES_CURRENT_DAYS * 86_400_000) {
        rabiesCurrent += 1;
        const latestRec = rabies.find((r) => recordDate(r) === latest);
        if (verified(latestRec)) rabiesCurrentVerified += 1;
      }
    }
  }

  const n = living.length;
  const pct = (k: number) => (n === 0 ? null : Math.round((k / n) * 100));
  return {
    denominator: n,
    sterilised,
    sterilisedVerified,
    rabiesCurrent,
    rabiesCurrentVerified,
    rabiesEver,
    sterilisedPct: pct(sterilised),
    rabiesCurrentPct: pct(rabiesCurrent),
  };
}
