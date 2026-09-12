/**
 * Convergent merge for the shared `pawbook_state` blob.
 *
 * The whole app state lives in one row, and every browser writes the entire
 * animals array on each action. Without a merge, two students using PawBook at
 * the same time clobber each other: last write wins, and whatever the loser
 * added (an animal, a comment, a like) is gone.
 *
 * These helpers merge the incoming write against what is already stored so the
 * two converge instead. The rules exploit the fact that nothing in the app ever
 * removes data — there is no delete-animal path, likes only ever increment —
 * so "keep both, prefer the larger/newer" is always the safe resolution.
 *
 * This is a stopgap while state lives in a single JSON blob. Per-entity rows
 * (scripts/02-enhanced-schema.sql already defines them) remove the need for it.
 */

type Json = Record<string, any>;

/** Newest of two ISO timestamps; tolerates missing or unparseable values. */
function newerTimestamp(a: unknown, b: unknown): string | undefined {
  const ta = typeof a === 'string' ? Date.parse(a) : NaN;
  const tb = typeof b === 'string' ? Date.parse(b) : NaN;
  if (Number.isNaN(ta) && Number.isNaN(tb)) return undefined;
  if (Number.isNaN(ta)) return b as string;
  if (Number.isNaN(tb)) return a as string;
  return ta >= tb ? (a as string) : (b as string);
}

/**
 * Keep the newer of a timestamp and carry its companion field with it, so
 * `last_fed` and `last_fed_by` can never describe different events.
 */
function mergeTimestampPair(out: Json, current: Json, incoming: Json, tsKey: string, byKey: string) {
  const winner = newerTimestamp(current[tsKey], incoming[tsKey]);
  if (winner === undefined) return;
  out[tsKey] = winner;
  const source = winner === incoming[tsKey] ? incoming : current;
  if (source[byKey] !== undefined) out[byKey] = source[byKey];
}

/** Identity for list items: prefer an explicit id, else the whole value. */
function itemKey(item: unknown): string {
  if (item && typeof item === 'object') {
    const id = (item as Json).id;
    if (id !== undefined && id !== null) return `id:${String(id)}`;
  }
  return `raw:${JSON.stringify(item)}`;
}

/**
 * Union two lists by item identity, preserving order (current first, then
 * anything new from incoming). `onCollide` resolves items present in both.
 */
function unionById<T>(current: unknown, incoming: unknown, onCollide?: (a: T, b: T) => T): T[] {
  const a = Array.isArray(current) ? current : [];
  const b = Array.isArray(incoming) ? incoming : [];
  const byKey = new Map<string, T>();
  const order: string[] = [];

  for (const item of [...a, ...b]) {
    const key = itemKey(item);
    const seen = byKey.get(key);
    if (seen === undefined) {
      byKey.set(key, item as T);
      order.push(key);
    } else if (onCollide) {
      byKey.set(key, onCollide(seen, item as T));
    }
  }

  return order.map((key) => byKey.get(key) as T);
}

/** Memories carry their own like counts, which also only ever increase. */
function mergeMemory(a: Json, b: Json): Json {
  return { ...a, ...b, likes: Math.max(Number(a?.likes) || 0, Number(b?.likes) || 0) };
}

/**
 * Merge one animal. Scalar profile fields (name, description, status, …) take
 * the incoming value, since that client is the one actively editing — but only
 * when it actually has one, so a stale client cannot blank out a field.
 */
export function mergeAnimal(current: Json, incoming: Json): Json {
  const out: Json = { ...current };

  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== null) out[key] = value;
  }

  // Counters only ever go up.
  out.likes = Math.max(Number(current?.likes) || 0, Number(incoming?.likes) || 0);
  out.trust_score = Math.max(Number(current?.trust_score) || 0, Number(incoming?.trust_score) || 0);

  // Contributions from both sides are kept.
  out.comments = unionById(current?.comments, incoming?.comments);
  out.memories = unionById<Json>(current?.memories, incoming?.memories, mergeMemory);
  out.medical_records = unionById(current?.medical_records, incoming?.medical_records);
  out.gallery = unionById(current?.gallery, incoming?.gallery);

  // Care timestamps: newest wins, each with the name attached to it.
  mergeTimestampPair(out, current, incoming, 'last_seen', 'last_seen_by');
  mergeTimestampPair(out, current, incoming, 'last_fed', 'last_fed_by');
  mergeTimestampPair(out, current, incoming, 'last_cared_at', 'last_cared_by');

  const createdAt = newerTimestamp(incoming?.created_at, current?.created_at);
  // An animal's creation time should only ever move earlier, never later.
  if (current?.created_at && incoming?.created_at) {
    out.created_at = createdAt === current.created_at ? incoming.created_at : current.created_at;
  }

  return out;
}

/**
 * Merge two `{ state: { animals: [...] }, version }` envelopes.
 *
 * Animals present in only one side are always kept: an animal missing from the
 * incoming write means that client loaded before it existed, not that someone
 * deleted it.
 */
export function mergeState(current: unknown, incoming: unknown): unknown {
  if (!current || typeof current !== 'object') return incoming;
  if (!incoming || typeof incoming !== 'object') return current;

  const cur = current as Json;
  const inc = incoming as Json;
  const curAnimals = Array.isArray(cur?.state?.animals) ? cur.state.animals : null;
  const incAnimals = Array.isArray(inc?.state?.animals) ? inc.state.animals : null;

  // Not the shape we know how to merge — take the incoming write unchanged.
  if (!curAnimals || !incAnimals) return incoming;

  const animals = unionById<Json>(curAnimals, incAnimals, mergeAnimal);

  return {
    ...cur,
    ...inc,
    state: { ...cur.state, ...inc.state, animals },
  };
}
