/**
 * Injury and rescue reports.
 *
 * Kept in the same persisted row as animals, so a report filed on one phone is
 * visible to everyone — previously these lived in component useState and
 * disappeared on reload, which meant a student could file one and believe it
 * had been sent somewhere.
 */

export type EmergencySeverity = 'critical' | 'urgent' | 'moderate';

export interface EmergencyCase {
  id: string;
  description: string;
  severity: EmergencySeverity;
  location: string;
  images: string[];
  timestamp: string;
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

/** Most serious first, then most recent. Resolved reports sink to the bottom. */
export function sortEmergencies(cases: EmergencyCase[]): EmergencyCase[] {
  const rank: Record<EmergencySeverity, number> = { critical: 0, urgent: 1, moderate: 2 };
  return [...cases].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
