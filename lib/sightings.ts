/**
 * A history of where an animal has been, as coarse zones over time.
 *
 * Until now the app kept one timestamp per kind of care — last_seen, last_fed —
 * and overwrote it. That answers "when was she last seen" and nothing else: not
 * where, not how often, not whether she has moved. A sighting log is the
 * smallest thing that answers those, and it is what every serious field system
 * keeps, from eBird checklists to TNR colony trackers.
 *
 * Every entry records a zone, never a coordinate. "H11" and "EE Department" are
 * what a person needs to go and look; a point on a map is what someone needs
 * to go and hurt. The log is append-only and capped, so it cannot grow without
 * bound in a row that every client rewrites.
 */

import type { Animal } from './demo-data';

/**
 * `not_found` is the presence/absence signal: "I looked at the usual spot and
 * they were not there." It is what makes "not seen in 11 days" trustworthy —
 * without it, silence means nobody looked, not that nobody saw.
 */
export type SightingKind = 'seen' | 'fed' | 'treated' | 'sheltered' | 'observation' | 'emergency' | 'not_found';

export interface Sighting {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Free-text area — "H11", "Main Gate". Never a coordinate. */
  zone: string;
  kind: SightingKind;
  /** Pseudonym or the anonymous label. Never a real identity. */
  by?: string;
  note?: string;
}

/** Most recent entries kept per animal. Old ones fall off the end. */
export const MAX_SIGHTINGS = 200;

export function newSighting(kind: SightingKind, zone: string, by?: string, note?: string): Sighting {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    zone: (zone ?? '').trim() || 'Campus',
    kind,
    by,
    note: note?.trim() || undefined,
  };
}

/** Newest first, capped. */
export function appendSighting(existing: unknown, sighting: Sighting): Sighting[] {
  const list = Array.isArray(existing) ? (existing as Sighting[]) : [];
  return [sighting, ...list]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, MAX_SIGHTINGS);
}

export interface ZoneShare {
  zone: string;
  count: number;
  /** 0–1 share of all sightings. */
  share: number;
  lastAt: string;
}

/**
 * Where an animal is usually found, from the zones it has been seen in.
 *
 * This is deliberately a frequency table and not a home-range estimate. With a
 * few dozen sightings, honest methods like minimum convex polygons or kernel
 * density need coordinates we do not keep and sample sizes we do not have.
 * "Usually near H11, sometimes EE Department" is a claim the data can support.
 */
export function zoneSummary(sightings: unknown, limit = 3): ZoneShare[] {
  const list = Array.isArray(sightings) ? (sightings as Sighting[]) : [];
  if (list.length === 0) return [];

  const byZone = new Map<string, { count: number; lastAt: string }>();
  for (const s of list) {
    // An absence says where someone looked, not where the animal was.
    if (s?.kind === 'not_found') continue;
    const key = (s?.zone ?? '').trim();
    if (!key) continue;
    const cur = byZone.get(key);
    if (!cur) byZone.set(key, { count: 1, lastAt: s.at });
    else {
      cur.count += 1;
      if (Date.parse(s.at) > Date.parse(cur.lastAt)) cur.lastAt = s.at;
    }
  }

  const total = Array.from(byZone.values()).reduce((n, z) => n + z.count, 0);
  return Array.from(byZone.entries())
    .map(([zone, z]) => ({ zone, count: z.count, share: z.count / total, lastAt: z.lastAt }))
    .sort((a, b) => b.count - a.count || Date.parse(b.lastAt) - Date.parse(a.lastAt))
    .slice(0, limit);
}

/** "Usually near H11 · sometimes EE Department" — or empty when there is nothing to say. */
export function describeRange(sightings: unknown): string {
  const zones = zoneSummary(sightings, 3);
  if (zones.length === 0) return '';
  const [top, ...rest] = zones;
  const parts = [`Usually near ${top.zone}`];
  const others = rest.filter((z) => z.share >= 0.15).map((z) => z.zone);
  if (others.length) parts.push(`sometimes ${others.join(' or ')}`);
  return parts.join(' · ');
}

/** How many times someone looked and did not find them, most recent first. */
export function absencesOf(animal: Pick<Animal, 'sightings'>): Sighting[] {
  return sightingsOf(animal).filter((s) => s.kind === 'not_found');
}

const DAY_MS = 86_400_000;

/** Sightings inside the last `days`, excluding absences — those are looks, not finds. */
export function sightingsInWindow(animal: Pick<Animal, 'sightings'>, days: number, now = Date.now()): Sighting[] {
  const since = now - days * DAY_MS;
  return sightingsOf(animal).filter((s) => {
    if (s?.kind === 'not_found') return false;
    const at = Date.parse(s?.at ?? '');
    return Number.isFinite(at) && at >= since && at <= now;
  });
}

/** NTU's threshold: a new animal seen this often is here to stay and needs a survey. */
export const ESCALATE_SIGHTINGS = 3;
export const ESCALATE_WINDOW_DAYS = 14;
/** Beyond this the animal is a resident, not a newcomer, and the nudge is noise. */
export const NEW_ANIMAL_DAYS = 30;

/**
 * NTU Taiwan's campus-dog guidelines escalate an unfamiliar animal after three
 * sightings in two weeks: at that point it is not passing through, and someone
 * should go and register it properly — survey, photo, temperament, ABC status.
 * The age cut keeps the nudge on newcomers; a dog known for years and seen
 * every day has nothing left to escalate.
 */
export function isEscalated(animal: Pick<Animal, 'sightings' | 'created_at'>, now = Date.now()): boolean {
  const created = Date.parse(animal?.created_at ?? '');
  if (!Number.isFinite(created) || now - created > NEW_ANIMAL_DAYS * DAY_MS) return false;
  return sightingsInWindow(animal, ESCALATE_WINDOW_DAYS, now).length >= ESCALATE_SIGHTINGS;
}

/** Sightings for an animal, tolerant of records that predate the feature. */
export function sightingsOf(animal: Pick<Animal, 'sightings'>): Sighting[] {
  return Array.isArray(animal?.sightings) ? animal.sightings : [];
}
