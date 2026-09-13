/**
 * Injury and rescue reports.
 *
 * Kept in the same persisted row as animals, so a report filed on one phone is
 * visible to everyone — previously these lived in component useState and
 * disappeared on reload, which meant a student could file one and believe it
 * had been sent somewhere.
 *
 * A report is not a single flag that flips from open to resolved. Between the
 * two, someone sets out, the animal reaches a vet, and sometimes whoever went
 * finds nothing there — and after "resolved", the next person past the spot may
 * find the dog still limping. FixMyStreet and Swachhata both learned this the
 * hard way: a closed report that cannot be reopened is closed by whoever got
 * bored first, not by the problem going away. So each report carries a status
 * and a thread of updates, and the status is whatever the newest update says.
 */

export type EmergencySeverity = 'critical' | 'urgent' | 'moderate';

export type EmergencyStatus =
  | 'open'
  | 'responder_on_way'
  | 'at_vet'
  | 'resolved'
  | 'reopened'
  | 'closed_not_found'
  | 'closed_duplicate';

/**
 * One entry in a report's thread. Any of the optional fields may be set on
 * its own: a note without a status change, a photo without a note, or a bare
 * status change. Never a position — the report's `location` is prose, and the
 * same rule that keeps coordinates out of sightings keeps them out of here.
 */
export interface EmergencyUpdate {
  id: string;
  at: string;
  by?: string;
  status?: EmergencyStatus;
  note?: string;
  photo_url?: string;
}

export interface EmergencyCase {
  id: string;
  description: string;
  severity: EmergencySeverity;
  location: string;
  images: string[];
  timestamp: string;
  /**
   * Where the report is in its life. Absent on rows written before the
   * lifecycle existed; `statusOf` derives one from `resolved` for those.
   */
  status?: EmergencyStatus;
  updates?: EmergencyUpdate[];
  /**
   * Kept in step with `status` so a client that only knows the old boolean
   * still hides the buttons and sinks the card. True for every closed status,
   * not only `resolved`, because that is what "handled" meant to that client.
   */
  resolved: boolean;
  resolved_at?: string;
  /** Names of people who said they are going to help. */
  responders: string[];
}

export const SEVERITY_LABEL: Record<EmergencySeverity, string> = {
  critical: 'Critical',
  urgent: 'Urgent',
  moderate: 'Needs attention',
};

export const STATUS_LABEL: Record<EmergencyStatus, string> = {
  open: 'Open',
  responder_on_way: 'Someone is on the way',
  at_vet: 'At the vet',
  resolved: 'Resolved',
  reopened: 'Reopened',
  closed_not_found: 'Closed — animal not found',
  closed_duplicate: 'Closed — duplicate report',
};

/** Statuses that mean nobody needs to act on the report any more. */
const CLOSED: ReadonlySet<EmergencyStatus> = new Set(['resolved', 'closed_not_found', 'closed_duplicate']);

export function isClosed(status: EmergencyStatus): boolean {
  return CLOSED.has(status);
}

const ALL_STATUSES = new Set<string>(Object.keys(STATUS_LABEL));

export function isEmergencyStatus(value: unknown): value is EmergencyStatus {
  return typeof value === 'string' && ALL_STATUSES.has(value);
}

/**
 * The status of a report, including one written before statuses existed.
 * Accepts a loose shape so the merge can call it on raw JSON.
 */
export function statusOf(report: { status?: unknown; resolved?: unknown } | null | undefined): EmergencyStatus {
  if (isEmergencyStatus(report?.status)) return report.status;
  return report?.resolved ? 'resolved' : 'open';
}

export function updatesOf(report: { updates?: unknown } | null | undefined): EmergencyUpdate[] {
  return Array.isArray(report?.updates) ? (report.updates as EmergencyUpdate[]) : [];
}

/** Oldest first, so the thread reads top to bottom. Tolerates a missing `at`. */
export function sortUpdates(updates: EmergencyUpdate[]): EmergencyUpdate[] {
  return [...updates].sort((a, b) => (Date.parse(a?.at) || 0) - (Date.parse(b?.at) || 0));
}

/** The most recent update that changed status, if any. */
export function newestStatusUpdate(updates: EmergencyUpdate[]): EmergencyUpdate | undefined {
  return sortUpdates(updates)
    .reverse()
    .find((u) => isEmergencyStatus(u?.status));
}

export function newEmergencyUpdate(
  fields: Omit<EmergencyUpdate, 'id' | 'at'> & Partial<Pick<EmergencyUpdate, 'at'>>,
): EmergencyUpdate {
  const update: EmergencyUpdate = {
    id: `eu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: fields.at ?? new Date().toISOString(),
  };
  // Only carry the keys that were given, so a bare status change does not
  // persist a clutch of `undefined`s.
  if (fields.by) update.by = fields.by;
  if (fields.status) update.status = fields.status;
  if (fields.note?.trim()) update.note = fields.note.trim();
  if (fields.photo_url) update.photo_url = fields.photo_url;
  return update;
}

/**
 * Set a report's status and keep the compat fields honest. `at` is the moment
 * of the change; it becomes `resolved_at` when the change closes the report.
 */
export function withStatus(report: EmergencyCase, status: EmergencyStatus, at: string): EmergencyCase {
  const closed = isClosed(status);
  const next: EmergencyCase = { ...report, status, resolved: closed };
  if (closed) next.resolved_at = at;
  else delete next.resolved_at;
  return next;
}

/** Append an update and, if it carries a status, move the report there. */
export function applyUpdate(report: EmergencyCase, update: EmergencyUpdate): EmergencyCase {
  const updates = [...updatesOf(report).filter((u) => u.id !== update.id), update];
  const status = update.status ?? statusOf(report);
  return withStatus({ ...report, updates }, status, update.at);
}

/** Most serious first, then most recent. Closed reports sink to the bottom. */
export function sortEmergencies(cases: EmergencyCase[]): EmergencyCase[] {
  const rank: Record<EmergencySeverity, number> = { critical: 0, urgent: 1, moderate: 2 };
  return [...cases].sort((a, b) => {
    const ca = isClosed(statusOf(a));
    const cb = isClosed(statusOf(b));
    if (ca !== cb) return ca ? 1 : -1;
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
