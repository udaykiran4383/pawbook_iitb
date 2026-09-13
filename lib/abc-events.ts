/**
 * ABC Event Schema v0.1 — a street animal's life as machine-readable events.
 *
 * India's Animal Birth Control Rules 2023 define what must be recorded about
 * every dog an ABC centre handles: Rule 12(1) lists the capture-and-release
 * register fields, Schedule III the per-veterinarian monthly surgery return,
 * Schedule IV the daily counts an MVO and DVO sign. Municipalities pay NGOs
 * ₹1,450–1,850 per dog against those returns. And the whole thing is a PDF —
 * there is no machine-readable form of it anywhere, in a programme where
 * Ratlam claimed 33,630 sterilisations, was paid ₹2.29 crore, and a survey
 * found 2,204.
 *
 * This is that form. Every field here maps to a named field in the Rules, the
 * identity key is the NDDB 15-digit ID that MCD already stamps on dogs, and
 * each event carries a provenance tier so a feeder's word and a PHO's record
 * are never confused. Schedules III and IV are derived from the events rather
 * than typed in, so a return cannot say more than the ledger does.
 *
 * Deliberately small. A schema that AWBI or a Local ABC Monitoring Committee
 * could adopt as its "prescribed format" under Rule 13(iii) has to fit on a
 * page. The JSON Schema in /public/schema/abc-event.v0.1.json is the same
 * thing in a form other software can validate against.
 */

import type { Animal } from './demo-data';
import type { RecordSource } from './demo-data';

/** Rule 12(1) and Schedules III/IV, as event kinds. */
export type AbcEventType =
  | 'capture'        // Rule 12(1)(i)–(v): area, date/time, squad, tag, description
  | 'sterilisation'  // Schedule III: surgery, vet, registration no.
  | 'arv'            // anti-rabies vaccination
  | 'booster'
  | 'deworming'
  | 'treatment'
  | 'observation'    // under post-operative observation (Schedule IV column)
  | 'release'        // Rule 12(1)(vi): date, time, place of release
  | 'death';         // Schedule IV mortality

export type EarNotch = 'right' | 'left' | 'none' | 'unknown';

export interface AbcEvent {
  /** Stable id for this event record. */
  event_id: string;
  event_type: AbcEventType;
  /** ISO 8601 with offset. */
  occurred_at: string;

  // ── Identity ────────────────────────────────────────────────────────────
  /** NDDB 15-digit identification number (ISO 11784), if chipped. */
  nddb_id?: string;
  /** Rule 11(8): numbered collar/tag assigned on arrival at the centre. */
  tag_number?: string;
  /** This system's own id, so unchipped animals still have one. */
  local_id: string;
  local_system: 'pawbook';

  // ── Rule 12(1) description ──────────────────────────────────────────────
  species?: 'dog' | 'cat' | 'other';
  sex?: 'male' | 'female' | 'unknown';
  colour?: string;
  identification_marks?: string;
  approx_age?: string;

  // ── Place, as zone or ward. Never a precise point in this schema. ───────
  /** Rule 12(1)(i) area of capture / 12(1)(vi) place of release. */
  locality?: string;
  ward?: string;

  // ── Who did it ─────────────────────────────────────────────────────────
  /** Capturing squad names (Rule 12(1)(iii)) or the NGO/PIA. */
  performed_by?: string;
  /** Schedule III: veterinarian's name and registration number. */
  vet_name?: string;
  vet_registration_no?: string;
  /** Rule 11(16): V-notch on the right ear. Observed — not proof of surgery. */
  ear_notch?: EarNotch;

  // ── Medical detail ─────────────────────────────────────────────────────
  vaccine?: string;
  batch_no?: string;
  valid_until?: string;
  /** Schedule III: post-operative complication, if any. */
  complication?: string;
  notes?: string;

  // ── Evidence and provenance ────────────────────────────────────────────
  /** SHA-256 of a certificate or photo held elsewhere, so it can be checked later. */
  evidence_hash?: string;
  source: RecordSource; // pho_record | awo_certificate | feeder_report | unknown
  recorded_at: string;
  /** Pseudonym of whoever entered it, never an identity. */
  recorded_by?: string;
}

export const ABC_SCHEMA_VERSION = '0.1';

/** ISO 11784 transponder codes are exactly 15 digits. */
export function isValidNddbId(id: unknown): boolean {
  return typeof id === 'string' && /^\d{15}$/.test(id);
}

const EVENT_TYPES = new Set<AbcEventType>([
  'capture', 'sterilisation', 'arv', 'booster', 'deworming', 'treatment', 'observation', 'release', 'death',
]);
const SOURCES = new Set<RecordSource>(['pho_record', 'awo_certificate', 'feeder_report', 'unknown']);

/** Structural validation. Returns a list of problems; empty means valid. */
export function validateAbcEvent(e: unknown): string[] {
  const problems: string[] = [];
  if (!e || typeof e !== 'object' || Array.isArray(e)) return ['event must be an object'];
  const ev = e as Record<string, unknown>;

  if (typeof ev.event_id !== 'string' || !ev.event_id) problems.push('event_id required');
  if (!EVENT_TYPES.has(ev.event_type as AbcEventType)) problems.push('event_type must be one of ' + [...EVENT_TYPES].join('|'));
  if (typeof ev.occurred_at !== 'string' || Number.isNaN(Date.parse(ev.occurred_at))) problems.push('occurred_at must be an ISO 8601 date');
  if (typeof ev.recorded_at !== 'string' || Number.isNaN(Date.parse(ev.recorded_at))) problems.push('recorded_at must be an ISO 8601 date');
  if (typeof ev.local_id !== 'string' || !ev.local_id) problems.push('local_id required');
  if (ev.local_system !== 'pawbook') problems.push('local_system must be "pawbook" in this version');
  if (!SOURCES.has(ev.source as RecordSource)) problems.push('source must be one of ' + [...SOURCES].join('|'));
  if (ev.nddb_id !== undefined && !isValidNddbId(ev.nddb_id)) problems.push('nddb_id must be exactly 15 digits');
  if (ev.ear_notch !== undefined && !['right', 'left', 'none', 'unknown'].includes(ev.ear_notch as string)) problems.push('ear_notch must be right|left|none|unknown');
  if (ev.evidence_hash !== undefined && !/^[0-9a-f]{64}$/.test(String(ev.evidence_hash))) problems.push('evidence_hash must be a hex SHA-256');
  if (ev.event_type === 'sterilisation' && ev.source !== 'feeder_report' && ev.source !== 'unknown' && !ev.vet_registration_no) {
    problems.push('a verified sterilisation needs vet_registration_no (Schedule III)');
  }
  // Precise coordinates have no place in this schema.
  for (const k of ['lat', 'lng', 'latitude', 'longitude', 'coords', 'location_coords']) {
    if (k in ev) problems.push(`${k} is not permitted; use locality/ward`);
  }
  return problems;
}

// ── Adapter from PawBook's own records ────────────────────────────────────

function classify(record: any): AbcEventType {
  const text = `${record?.title ?? ''} ${record?.record_type ?? ''} ${record?.description ?? ''}`.toLowerCase();
  if (/steril|spay|neuter|castrat|\babc\b/.test(text)) return 'sterilisation';
  if (/booster/.test(text)) return 'booster';
  if (/rabies|\barv\b/.test(text) && /vaccin|shot|dose/.test(text)) return 'arv';
  if (/deworm/.test(text)) return 'deworming';
  if (record?.record_type === 'vaccination') return 'arv';
  return 'treatment';
}

/** Everything PawBook knows about an animal, as ABC events. */
export function toAbcEvents(animal: Animal, campusName: string): AbcEvent[] {
  const events: AbcEvent[] = [];
  const localId = `pawbook:${animal.id}`;
  const nddb = animal.external_ids?.nddb_id;
  const obs = animal.observation ?? {};
  const base = {
    local_id: localId,
    local_system: 'pawbook' as const,
    ...(isValidNddbId(nddb) ? { nddb_id: nddb } : {}),
    species: (animal.animal_type === 'dog' || animal.animal_type === 'cat' ? animal.animal_type : 'other') as 'dog' | 'cat' | 'other',
    sex: obs.sex ?? 'unknown',
    identification_marks: animal.description?.slice(0, 200),
    approx_age: obs.age_class,
    ear_notch: (obs.ear_notch_seen ? 'right' : 'unknown') as EarNotch,
  };

  for (const r of (Array.isArray(animal.medical_records) ? animal.medical_records : []) as any[]) {
    const at = r?.record_date ?? r?.date;
    if (!at || Number.isNaN(Date.parse(at))) continue;
    events.push({
      ...base,
      event_id: `pb-${animal.id}-${r.id}`,
      event_type: classify(r),
      occurred_at: new Date(at).toISOString(),
      locality: animal.location,
      performed_by: campusName,
      vet_name: r?.veterinarian,
      vet_registration_no: r?.vet_reg_no,
      notes: [r?.title, r?.description].filter(Boolean).join(' — ').slice(0, 500),
      valid_until: r?.next_due,
      source: (r?.source ?? 'unknown') as RecordSource,
      recorded_at: new Date(at).toISOString(),
    });
  }

  if (animal.status === 'deceased' && animal.death_date && !Number.isNaN(Date.parse(animal.death_date))) {
    events.push({
      ...base,
      event_id: `pb-${animal.id}-death`,
      event_type: 'death',
      occurred_at: new Date(animal.death_date).toISOString(),
      locality: animal.location,
      notes: animal.death_note?.slice(0, 500),
      source: 'feeder_report',
      recorded_at: new Date(animal.death_date).toISOString(),
    });
  }

  return events.sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));
}

// ── Schedules, derived from events ────────────────────────────────────────

export interface ScheduleIIIRow {
  vet_name: string;
  vet_registration_no: string;
  surgeries: number;
  complications: number;
  deaths_post_op: number;
  /** Only verified sources count toward a return an officer signs. */
  verified_surgeries: number;
}

/** Schedule III: per-veterinarian surgery return for a month (YYYY-MM). */
export function scheduleIII(events: AbcEvent[], month: string): ScheduleIIIRow[] {
  const rows = new Map<string, ScheduleIIIRow>();
  const inMonth = (e: AbcEvent) => e.occurred_at.slice(0, 7) === month;
  for (const e of events.filter((e) => e.event_type === 'sterilisation' && inMonth(e))) {
    const key = `${e.vet_registration_no ?? ''}|${e.vet_name ?? ''}`;
    const row = rows.get(key) ?? {
      vet_name: e.vet_name ?? '(not recorded)',
      vet_registration_no: e.vet_registration_no ?? '(not recorded)',
      surgeries: 0, complications: 0, deaths_post_op: 0, verified_surgeries: 0,
    };
    row.surgeries += 1;
    if (e.complication) row.complications += 1;
    if (e.source === 'pho_record' || e.source === 'awo_certificate') row.verified_surgeries += 1;
    rows.set(key, row);
  }
  return Array.from(rows.values()).sort((a, b) => b.surgeries - a.surgeries);
}

export interface ScheduleIVRow {
  date: string;
  captured_male: number;
  captured_female: number;
  captured_total: number;
  sterilised: number;
  under_observation: number;
  released: number;
  mortality: number;
}

/** Schedule IV: daily counts for a month, ready for the MVO/DVO signature columns. */
export function scheduleIV(events: AbcEvent[], month: string): ScheduleIVRow[] {
  const days = new Map<string, ScheduleIVRow>();
  for (const e of events) {
    const date = e.occurred_at.slice(0, 10);
    if (!date.startsWith(month)) continue;
    const row = days.get(date) ?? {
      date, captured_male: 0, captured_female: 0, captured_total: 0,
      sterilised: 0, under_observation: 0, released: 0, mortality: 0,
    };
    switch (e.event_type) {
      case 'capture':
        row.captured_total += 1;
        if (e.sex === 'male') row.captured_male += 1;
        if (e.sex === 'female') row.captured_female += 1;
        break;
      case 'sterilisation': row.sterilised += 1; break;
      case 'observation': row.under_observation += 1; break;
      case 'release': row.released += 1; break;
      case 'death': row.mortality += 1; break;
    }
    days.set(date, row);
  }
  return Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Rule 12(1) order, for the events CSV. */
export const ABC_EVENT_COLUMNS: Array<keyof AbcEvent> = [
  'event_id', 'event_type', 'occurred_at', 'nddb_id', 'tag_number', 'local_id', 'local_system',
  'species', 'sex', 'colour', 'identification_marks', 'approx_age', 'locality', 'ward',
  'performed_by', 'vet_name', 'vet_registration_no', 'ear_notch',
  'vaccine', 'batch_no', 'valid_until', 'complication', 'notes',
  'evidence_hash', 'source', 'recorded_at', 'recorded_by',
];
