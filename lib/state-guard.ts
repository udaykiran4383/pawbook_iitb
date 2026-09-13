/**
 * Guards for the public /api/state endpoint.
 *
 * That route holds the whole app in one row and writes with the Supabase
 * service-role key, which bypasses row-level security. It takes an unsigned
 * body from anyone on the internet, and the free tier has no backups — so a
 * malformed or hostile write is unrecoverable. Merging (lib/state-merge.ts)
 * protects honest clients from each other; these checks are what stand between
 * the row and a crafted payload.
 *
 * This is defence in depth, not authentication. Real accountability needs
 * signed-in writers (Supabase anonymous sign-in is the cheapest route) and
 * per-entity rows with RLS.
 */

import { quantizeCoords } from './duplicate-detection';
import { slugFromStateId } from './campuses';

const MAX_BODY_BYTES = 2_000_000; // ~2 MB; the real blob is ~70 KB
const MAX_ANIMALS = 2_000;
const MAX_LIST_ITEMS = 5_000; // per list, per animal

/** Only the keys the app actually persists may be written: one row per registered campus, plus 'global'. */
function isAllowedStateId(id: string): boolean {
  return id === 'global' || slugFromStateId(id) !== null;
}

export interface GuardFailure {
  ok: false;
  status: number;
  error: string;
}
export interface GuardSuccess {
  ok: true;
}
export type GuardResult = GuardFailure | GuardSuccess;

const fail = (status: number, error: string): GuardFailure => ({ ok: false, status, error });

/** Reject ids we do not recognise, so the table cannot be used as free storage. */
export function checkStateId(id: unknown): GuardResult {
  if (typeof id !== 'string' || !id) return fail(400, 'Missing id');
  if (!isAllowedStateId(id)) return fail(403, 'Unknown state id');
  return { ok: true };
}

/**
 * Structural validation of an incoming state blob.
 *
 * Deliberately shape-only: it does not try to judge whether the contents are
 * true, just that they cannot blow up the row, the merge, or the client.
 */
export function checkStatePayload(data: unknown): GuardResult {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return fail(400, 'State must be an object');
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(data);
  } catch {
    return fail(400, 'State is not serializable');
  }
  if (serialized.length > MAX_BODY_BYTES) {
    return fail(413, 'State too large');
  }

  const animals = (data as any)?.state?.animals;

  // The `global` row is an empty object, so an absent animals list is fine —
  // but a present one must be an array we can merge.
  if (animals === undefined) return { ok: true };
  if (!Array.isArray(animals)) return fail(400, 'state.animals must be an array');
  if (animals.length > MAX_ANIMALS) return fail(413, 'Too many animals');

  for (const animal of animals) {
    if (!animal || typeof animal !== 'object' || Array.isArray(animal)) {
      return fail(400, 'Each animal must be an object');
    }
    if (animal.id === undefined || animal.id === null) {
      return fail(400, 'Each animal needs an id');
    }
    const sightings = (animal as any).sightings;
    if (sightings !== undefined && sightings !== null) {
      if (!Array.isArray(sightings)) return fail(400, 'sightings must be an array');
      if (sightings.length > MAX_LIST_ITEMS) return fail(413, 'Too many sightings');
      for (const s of sightings) {
        if (!s || typeof s !== 'object') return fail(400, 'Each sighting must be an object');
        // Zones only. A sighting carrying lat/lng is exactly the record the
        // coarse-location design exists to prevent.
        if ('lat' in s || 'lng' in s || 'coords' in s || 'location_coords' in s) {
          return fail(400, 'Sightings may not carry coordinates');
        }
      }
    }

    for (const key of ['comments', 'memories', 'medical_records', 'gallery']) {
      const list = (animal as any)[key];
      if (list === undefined || list === null) continue;
      if (!Array.isArray(list)) return fail(400, `${key} must be an array`);
      if (list.length > MAX_LIST_ITEMS) return fail(413, `Too many items in ${key}`);
    }
  }

  const emergencies = (data as any)?.state?.emergencies;
  if (emergencies !== undefined) {
    if (!Array.isArray(emergencies)) return fail(400, 'state.emergencies must be an array');
    if (emergencies.length > MAX_LIST_ITEMS) return fail(413, 'Too many emergency reports');
    for (const report of emergencies) {
      if (!report || typeof report !== 'object' || Array.isArray(report)) {
        return fail(400, 'Each emergency report must be an object');
      }
      if (!report.id) return fail(400, 'Each emergency report needs an id');
      if (report.responders !== undefined && !Array.isArray(report.responders)) {
        return fail(400, 'responders must be an array');
      }
    }
  }

  const stations = (data as any)?.state?.stations;
  if (stations !== undefined) {
    if (!Array.isArray(stations)) return fail(400, 'state.stations must be an array');
    if (stations.length > MAX_LIST_ITEMS) return fail(413, 'Too many feeding stations');
    for (const station of stations) {
      if (!station || typeof station !== 'object' || Array.isArray(station)) {
        return fail(400, 'Each feeding station must be an object');
      }
      if (!station.id) return fail(400, 'Each feeding station needs an id');
      // A feeding spot is a zone. A precise position for the place where
      // animals gather twice a day is the one record this app must never hold.
      if ('lat' in station || 'lng' in station || 'coords' in station || 'location_coords' in station) {
        return fail(400, 'Feeding stations may not carry coordinates');
      }
      if (station.times !== undefined && station.times !== null && !Array.isArray(station.times)) {
        return fail(400, 'times must be an array');
      }
    }
  }

  return { ok: true };
}

/**
 * Coarsen every position in an incoming write.
 *
 * The UI already rounds before sending, but the endpoint is public and takes
 * whatever it is given — so a precise coordinate could be posted straight past
 * the form. Enforcing it here means the stored row cannot contain a precise
 * position regardless of what the client does, which is the only version of
 * this guarantee that actually holds.
 */
export function coarsenStatePositions(data: unknown): unknown {
  const animals = (data as any)?.state?.animals;
  if (!Array.isArray(animals)) return data;

  return {
    ...(data as any),
    state: {
      ...(data as any).state,
      animals: animals.map((animal: any) => {
        const coords = animal?.location_coords;
        if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
          return animal;
        }
        return { ...animal, location_coords: quantizeCoords(coords) };
      }),
    },
  };
}

/** Best-effort client identity for rate limiting behind Vercel's proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
