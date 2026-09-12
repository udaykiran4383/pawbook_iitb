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

const MAX_BODY_BYTES = 2_000_000; // ~2 MB; the real blob is ~70 KB
const MAX_ANIMALS = 2_000;
const MAX_LIST_ITEMS = 5_000; // per list, per animal

/** Only the keys the app actually persists may be written. */
const ALLOWED_STATE_IDS = new Set(['pawbook-animal-storage', 'global']);

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
  if (!ALLOWED_STATE_IDS.has(id)) return fail(403, 'Unknown state id');
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
    for (const key of ['comments', 'memories', 'medical_records', 'gallery']) {
      const list = (animal as any)[key];
      if (list === undefined || list === null) continue;
      if (!Array.isArray(list)) return fail(400, `${key} must be an array`);
      if (list.length > MAX_LIST_ITEMS) return fail(413, `Too many items in ${key}`);
    }
  }

  return { ok: true };
}

/** Best-effort client identity for rate limiting behind Vercel's proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
