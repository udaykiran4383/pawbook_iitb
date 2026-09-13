'use client';

import { useState, useMemo } from 'react';
import { Loader } from 'lucide-react';
import { formatTimeSince, eventDescriptions, CareEventType } from '@/lib/care-tracking';
import { getDisplayActorName } from '@/lib/utils';
import { useAnimalStore } from '@/lib/animal-store';

interface CareTrackerProps {
  animalId: number;
}

interface CareEvent {
  id: string;
  event_type: CareEventType;
  notes: string;
  created_at: string;
}

export default function CareTracker({ animalId }: CareTrackerProps) {
  const [adding, setAdding] = useState(false);
  const [thanks, setThanks] = useState<string | null>(null);

  // Read the animal straight from the store so the timeline reflects what was
  // actually persisted, rather than the demo fixtures this used to show.
  const animal = useAnimalStore((state) => state.animals.find((a) => a.id === animalId));

  /**
   * The timeline is derived from the animal's own care fields. Those are what
   * survive a reload and what every other student sees, so showing anything
   * else here would be showing a number that isn't real.
   */
  const events = useMemo<CareEvent[]>(() => {
    if (!animal) return [];

    const entries: CareEvent[] = [];
    const push = (type: CareEventType, at?: string | null, by?: string | null) => {
      if (!at) return;
      const when = new Date(at);
      if (Number.isNaN(when.getTime())) return;
      const actor = getDisplayActorName(by ?? undefined, animal.contributor);
      entries.push({
        id: `${type}-${at}`,
        event_type: type,
        notes: actor ? `by ${actor}` : '',
        created_at: at,
      });
    };

    push('seen', animal.last_seen, animal.last_seen_by);
    push('fed', animal.last_fed, animal.last_fed_by);
    push(
      (animal.last_cared_type as CareEventType) || 'treated',
      animal.last_cared_at,
      animal.last_cared_by,
    );

    return entries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [animal]);

  const handleQuickAction = async (eventType: CareEventType) => {
    if (adding) return;
    setAdding(true);
    try {
      // This writes through the persisted store, so it reaches the database and
      // every other student's view. It used to be a setState plus a 400ms
      // setTimeout, which meant last_fed never actually changed.
      useAnimalStore.getState().logCareAction(animalId, eventType as 'seen' | 'fed' | 'treated' | 'sheltered');
      // A blocking alert() interrupts the person mid-flow and, on mobile, hides
      // the very timeline they just added to.
      // Feeders tend to stop at feeding. Feeding time is the best moment to notice
      // a limp or a wound, so the thank-you points at the survey card above.
      setThanks(
        eventType === 'fed'
          ? `Thank you for feeding ${animal?.name ?? 'them'}! 🐾 While you're there — anything you noticed? The survey card above takes 30 seconds.`
          : `Thank you for caring for ${animal?.name ?? 'them'}! 🐾`,
      );
      window.setTimeout(() => setThanks(null), 2500);
    } finally {
      setAdding(false);
    }
  };

  const actionEmojis: Record<string, string> = {
    seen: '👀', fed: '🍲', treated: '💊', sheltered: '🏠',
  };
  const actionLabels: Record<string, string> = {
    seen: 'I Saw Them', fed: 'I Fed Them', treated: 'Gave Care', sheltered: 'Gave Shelter',
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {(['seen', 'fed', 'treated', 'sheltered'] as const).map(type => (
          <button
            key={type}
            onClick={() => {
              handleQuickAction(type);
            }}
            disabled={adding}
            className="py-3 px-3 text-sm font-bold bg-white hover:bg-gray-50 dark:bg-muted/40 active:scale-95 border border-gray-200 dark:border-border text-foreground rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            {adding ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <span className="text-xl">{actionEmojis[type]}</span>
            )}
            <span className="font-bold text-xs">{actionLabels[type]}</span>
          </button>
        ))}
      </div>

      {thanks && (
        <p role="status" className="text-center text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl py-2 px-3">
          {thanks}
        </p>
      )}

      {/* Events Timeline */}
      <div className="mt-4">
        <h4 className="font-bold text-lg text-foreground mb-3">Care Timeline 📖</h4>
        {events.length === 0 ? (
          <div className="text-center text-foreground text-sm py-4">
            <p className="text-lg mb-2">No moments yet! 💭</p>
            <p className="text-xs">Click a button above to record the first care moment</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
            {events.map(event => (
              <div key={event.id} className="flex gap-3 text-sm bg-white/70 dark:bg-card p-3 rounded-lg border border-white shadow-sm hover:shadow-md transition">
                <div className="flex-shrink-0 text-2xl">
                  {event.event_type === 'seen' && '👀'}
                  {event.event_type === 'fed' && '🍲'}
                  {event.event_type === 'treated' && '💊'}
                  {event.event_type === 'sheltered' && '🏠'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-bold">
                    {eventDescriptions[event.event_type as CareEventType] || event.event_type}
                  </p>
                  <p className="text-muted-foreground text-xs font-medium">
                    {formatTimeSince(new Date(event.created_at))}
                  </p>
                  {event.notes && (
                    <p className="text-foreground text-xs mt-1 italic">{event.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
