/**
 * Records in the shape an institution can file.
 *
 * Since 19 May 2026 every educational institution in India has a named officer
 * answerable for the animals on its campus, and municipalities must keep
 * "digital, auditable records" of every stray. The people holding those roles
 * do not want an app; they want a register they can attach to an affidavit or
 * hand to a survey team. This produces that register, from the same data the
 * students already keep, in the vocabulary the survey teams already use.
 *
 * It is a CSV because that is what gets opened. Coordinates are never
 * included — the register carries zones, which is what the ABC Rules' own
 * "territory-wise" language asks for and what is safe to circulate.
 */

import type { Animal } from './demo-data';
import { lifecycleLabel } from './lifecycle';
import { getPresence } from './presence';
import { describeRange, sightingsOf } from './sightings';
import { summariseObservation } from './survey';
import { getCoverage, getWelfare } from './coverage';
import { ABC_EVENT_COLUMNS, scheduleIII, scheduleIV, toAbcEvents, type AbcEvent } from './abc-events';

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Quote when needed; double any embedded quotes.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(values: unknown[]): string {
  return values.map(cell).join(',');
}

function isoDate(value: unknown): string {
  const t = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10);
}

function latestRecord(animal: Animal, pattern: RegExp): string {
  const records = Array.isArray(animal.medical_records) ? animal.medical_records : [];
  const dates = records
    .filter((r: any) => pattern.test(`${r?.title ?? ''} ${r?.record_type ?? ''} ${r?.description ?? ''}`.toLowerCase()))
    .map((r: any) => Date.parse(r?.record_date ?? r?.date ?? ''))
    .filter((t) => !Number.isNaN(t));
  return dates.length ? new Date(Math.max(...dates)).toISOString().slice(0, 10) : '';
}

/** One line per animal: the register. */
export function animalRegisterCsv(animals: Animal[], now = Date.now()): string {
  const header = [
    'pawbook_id', 'name', 'species', 'status', 'home_zone', 'usual_range',
    'sex', 'age_class', 'body_condition', 'collar_seen', 'ear_notch_seen', 'visible_wound',
    'sterilisation_recorded_on', 'last_rabies_vaccination_on',
    'first_recorded_on', 'last_seen_on', 'days_since_seen', 'sightings_logged',
    'medical_records', 'memories',
  ];
  const lines = [row(header)];
  for (const a of animals) {
    const presence = getPresence(a, now);
    const obs = a.observation ?? {};
    lines.push(row([
      a.id, a.name, a.animal_type, lifecycleLabel(a.status), a.location, describeRange(a.sightings),
      obs.sex ?? '', obs.age_class ?? '', obs.body_condition ?? '',
      obs.collar_seen ? 'yes' : '', obs.ear_notch_seen ? 'yes' : '', obs.visible_wound ? 'yes' : '',
      latestRecord(a, /steril|spay|neuter|castrat|\babc\b/), latestRecord(a, /rabies|\barv\b/),
      isoDate(a.created_at), isoDate(a.last_seen), presence.daysSinceSeen ?? '', sightingsOf(a).length,
      Array.isArray(a.medical_records) ? a.medical_records.length : 0,
      Array.isArray(a.memories) ? a.memories.length : 0,
    ]));
  }
  return lines.join('\r\n') + '\r\n';
}

/** One line per sighting: the movement log. Zones only. */
export function sightingsCsv(animals: Animal[]): string {
  const lines = [row(['pawbook_id', 'name', 'species', 'date', 'time_utc', 'zone', 'contact'])];
  for (const a of animals) {
    for (const s of sightingsOf(a)) {
      const t = Date.parse(s.at);
      if (Number.isNaN(t)) continue;
      const d = new Date(t).toISOString();
      lines.push(row([a.id, a.name, a.animal_type, d.slice(0, 10), d.slice(11, 19), s.zone, s.kind]));
    }
  }
  return lines.join('\r\n') + '\r\n';
}

/** One line per medical event. Veterinarian is included: it is provenance, not a volunteer's identity. */
export function medicalCsv(animals: Animal[]): string {
  const lines = [row(['pawbook_id', 'name', 'species', 'date', 'record_type', 'title', 'description', 'veterinarian'])];
  for (const a of animals) {
    for (const r of (Array.isArray(a.medical_records) ? a.medical_records : []) as any[]) {
      lines.push(row([a.id, a.name, a.animal_type, isoDate(r?.record_date ?? r?.date), r?.record_type, r?.title, r?.description, r?.veterinarian]));
    }
  }
  return lines.join('\r\n') + '\r\n';
}

/** All animals' events in ABC Event Schema v0.1, Rule 12(1) column order. */
export function abcEventsCsv(animals: Animal[], campusName: string): string {
  const lines = [row(ABC_EVENT_COLUMNS)];
  // Chronological across all animals — a register reads as a ledger, not as
  // sixteen separate histories.
  const events = animals
    .flatMap((a) => toAbcEvents(a, campusName))
    .sort((x, y) => Date.parse(x.occurred_at) - Date.parse(y.occurred_at));
  for (const e of events) lines.push(row(ABC_EVENT_COLUMNS.map((k) => (e as any)[k])));
  return lines.join('\r\n') + '\r\n';
}

/** Schedule III for a month (YYYY-MM): per-veterinarian surgery return. */
export function scheduleIIICsv(animals: Animal[], campusName: string, month: string): string {
  const events: AbcEvent[] = animals.flatMap((a) => toAbcEvents(a, campusName));
  const lines = [row(['month', 'veterinarian', 'registration_no', 'surgeries', 'of_which_verified', 'post_op_complications', 'post_op_deaths'])];
  for (const r of scheduleIII(events, month)) {
    lines.push(row([month, r.vet_name, r.vet_registration_no, r.surgeries, r.verified_surgeries, r.complications, r.deaths_post_op]));
  }
  return lines.join('\r\n') + '\r\n';
}

/** Schedule IV for a month: daily counts with the two signature columns left blank. */
export function scheduleIVCsv(animals: Animal[], campusName: string, month: string): string {
  const events: AbcEvent[] = animals.flatMap((a) => toAbcEvents(a, campusName));
  const lines = [row(['date', 'captured_male', 'captured_female', 'captured_total', 'sterilised', 'under_observation', 'released', 'mortality', 'verification_by_MVO_JVO', 'verification_by_DVO'])];
  for (const r of scheduleIV(events, month)) {
    lines.push(row([r.date, r.captured_male, r.captured_female, r.captured_total, r.sterilised, r.under_observation, r.released, r.mortality, '', '']));
  }
  return lines.join('\r\n') + '\r\n';
}

/**
 * SHA-256 of a file's contents, hex. Printed on the cover sheet so anyone
 * holding the register later can check that what they were given is what was
 * generated — the "signed, dated" property an affidavit attachment needs,
 * without any signing infrastructure.
 */
export async function contentHash(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Everything the cover sheet needs, generated together so the hashes match the files. */
export async function buildRegisterBundle(
  animals: Animal[],
  campusName: string,
  estimatedPopulation: number | undefined,
  now = Date.now(),
): Promise<{ register: string; sightings: string; medical: string; abcEvents: string; summary: string }> {
  const register = animalRegisterCsv(animals, now);
  const sightings = sightingsCsv(animals);
  const medical = medicalCsv(animals);
  const abcEvents = abcEventsCsv(animals, campusName);
  const [h1, h2, h3, h4] = await Promise.all([contentHash(register), contentHash(sightings), contentHash(medical), contentHash(abcEvents)]);
  const summary =
    summaryText(animals, campusName, estimatedPopulation, now) +
    '\n\nIntegrity (SHA-256):\n' +
    `register.csv     ${h1}\n` +
    `sightings.csv    ${h2}\n` +
    `medical.csv      ${h3}\n` +
    `abc-events.csv   ${h4}   (ABC Event Schema v0.1 — see /schema/abc-event.v0.1.json)\n` +
    '\nTo verify on any machine: shasum -a 256 <file>';
  return { register, sightings, medical, abcEvents, summary };
}

/** The cover sheet: what the register is, and the honest denominators. */
export function summaryText(animals: Animal[], campusName: string, estimatedPopulation: number | undefined, now = Date.now()): string {
  const living = animals.filter((a) => a.status !== 'deceased');
  const cov = getCoverage(animals, now);
  const welfare = getWelfare(animals);
  const unseen = living.filter((a) => getPresence(a, now).state === 'unseen').length;
  const flagged = living.filter((a) => a.observation?.visible_wound || a.observation?.body_condition === 'thin').length;
  const when = new Date(now).toISOString().slice(0, 10);
  return [
    `PawBook register — ${campusName} — generated ${when}`,
    '',
    `Animals on record: ${animals.length} (${living.length} living)`,
    estimatedPopulation
      ? `Estimated campus population: ~${estimatedPopulation}. This register covers roughly ${Math.round((living.length / estimatedPopulation) * 100)}% of it and is NOT a census.`
      : 'No campus population estimate configured; this register is not a census.',
    '',
    `Sterilisation recorded: ${cov.sterilised} of ${cov.denominator} living animals on record`,
    `Rabies vaccination in the last 12 months: ${cov.rabiesCurrent} of ${cov.denominator}`,
    `Not seen in 45+ days: ${unseen}`,
    `Flagged on survey (wound or thin): ${flagged}`,
    '',
    `Welfare indicators (of ${welfare.surveyed} animals surveyed): thin ${welfare.thin}, hair loss ${welfare.hairLoss}, visible wound ${welfare.wound}, ticks/fleas ${welfare.ectoparasites}`,
    '',
    'Counts come from confirmed medical records only. An ear notch is recorded as observed and is not treated as proof of sterilisation.',
    'Locations are zones, never coordinates. Contributor identities are not included.',
    '',
    'Files: register.csv (one line per animal), sightings.csv (movement log), medical.csv (vet events).',
  ].join('\n');
}
