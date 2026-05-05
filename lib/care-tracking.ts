export type CareEventType = 'fed' | 'watered' | 'seen' | 'treated' | 'sheltered' | 'other';

export interface CareEvent {
  id: number;
  animalId: number;
  eventType: CareEventType;
  notes?: string;
  recordedBy?: string;
  createdAt: Date;
}

export interface CareStatus {
  animalId: number;
  lastFedAt: Date | null;
  lastSeenAt: Date | null;
  lastTreatedAt: Date | null;
  careLevel: 'active' | 'moderate' | 'at-risk' | 'unknown';
  daysWithoutCare: number;
}

// Determine care status based on recent activity
export function calculateCareStatus(
  events: CareEvent[],
  animal_created_at: Date
): CareStatus {
  if (events.length === 0) {
    return {
      animalId: events[0]?.animalId || 0,
      lastFedAt: null,
      lastSeenAt: null,
      lastTreatedAt: null,
      careLevel: 'unknown',
      daysWithoutCare: Math.floor(
        (Date.now() - animal_created_at.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };
  }

  const now = new Date();
  const lastFedAt = events
    .filter(e => e.eventType === 'fed')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt || null;

  const lastSeenAt = events
    .filter(e => e.eventType === 'seen')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt || null;

  const lastTreatedAt = events
    .filter(e => e.eventType === 'treated')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt || null;

  // Determine care level
  let careLevel: 'active' | 'moderate' | 'at-risk' | 'unknown' = 'unknown';

  if (lastFedAt || lastSeenAt) {
    const recentDate = lastFedAt || lastSeenAt;
    const daysSince = Math.floor((now.getTime() - recentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) {
      careLevel = 'active'; // Cared for today
    } else if (daysSince <= 3) {
      careLevel = 'active'; // Cared for recently
    } else if (daysSince <= 7) {
      careLevel = 'moderate'; // Week without care
    } else {
      careLevel = 'at-risk'; // More than a week
    }
  }

  const lastAnyEvent = Math.max(
    lastFedAt?.getTime() || 0,
    lastSeenAt?.getTime() || 0,
    lastTreatedAt?.getTime() || 0
  );

  const daysWithoutCare = lastAnyEvent === 0
    ? Math.floor((now.getTime() - animal_created_at.getTime()) / (1000 * 60 * 60 * 24))
    : Math.floor((now.getTime() - lastAnyEvent) / (1000 * 60 * 60 * 24));

  return {
    animalId: events[0]?.animalId || 0,
    lastFedAt,
    lastSeenAt,
    lastTreatedAt,
    careLevel,
    daysWithoutCare,
  };
}

// Format time since for display
export function formatTimeSince(date: Date | null): string {
  if (!date) return 'Never recorded';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

// Get color based on care level
export function getCareColor(level: string): string {
  switch (level) {
    case 'active':
      return 'text-green-600'; // 🟢 Active care
    case 'moderate':
      return 'text-yellow-600'; // 🟡 Moderate
    case 'at-risk':
      return 'text-red-600'; // 🔴 At risk
    default:
      return 'text-gray-600'; // ⚪ Unknown
  }
}

// Event type descriptions
export const eventDescriptions: Record<CareEventType, string> = {
  fed: 'Animal was fed',
  watered: 'Animal was given water',
  seen: 'Animal was spotted/seen',
  treated: 'Animal received medical treatment',
  sheltered: 'Animal was provided shelter',
  other: 'Other care activity',
};
