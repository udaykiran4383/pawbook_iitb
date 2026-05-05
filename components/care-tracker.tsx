'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader } from 'lucide-react';
import { formatTimeSince, getCareColor, eventDescriptions, CareEventType } from '@/lib/care-tracking';
import { getDemoCareEvents } from '@/lib/demo-data';

interface CareTrackerProps {
  animalId: number;
}

interface CareEvent {
  id: number;
  event_type: CareEventType;
  notes: string;
  created_at: string;
}

export default function CareTracker({ animalId }: CareTrackerProps) {
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<CareEventType>('seen');

  // Load demo care events
  useEffect(() => {
    const demoEvents = getDemoCareEvents(animalId);
    setEvents(demoEvents as any);
    setLoading(false);
  }, [animalId]);

  const handleQuickAction = async (eventType: CareEventType) => {
    setAdding(true);
    try {
      console.log('[v0] Recording care action:', eventType);
      
      // Create new event
      const newEvent: CareEvent = {
        id: Math.floor(Math.random() * 1000000),
        event_type: eventType,
        notes: '',
        created_at: new Date().toISOString(),
      };

      // Add to events immediately
      setEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 400));
    } catch (error) {
      console.error('[v0] Action error:', error);
    } finally {
      setAdding(false);
    }
  };

  const actionEmojis = {
    seen: '👀',
    fed: '🍲',
    treated: '💊',
    sheltered: '🏠'
  };

  return (
    <div className="space-y-4 border-t-2 border-white/30 pt-4 mt-4">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {(['seen', 'fed', 'treated', 'sheltered'] as const).map(type => (
          <button
            key={type}
            onClick={() => {
              handleQuickAction(type);
              console.log('[v0] Care action recorded:', type);
            }}
            disabled={adding}
            className="py-3 px-3 text-sm font-bold bg-white/90 hover:bg-white active:scale-95 border-2 border-white text-foreground rounded-full transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {adding ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <span className="text-xl">{actionEmojis[type]}</span>
            )}
            <span className="font-bold text-xs sm:text-sm">
              {type === 'seen' ? 'Seen' : type === 'fed' ? 'Fed' : type === 'treated' ? 'Care' : 'Shelter'}
            </span>
          </button>
        ))}
      </div>

      {/* Events Timeline */}
      <div className="mt-4">
        <h4 className="font-bold text-lg text-foreground mb-3">Care Timeline 📖</h4>
        {loading ? (
          <div className="text-center text-foreground text-sm py-4 animate-pulse">Loading moments...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-foreground text-sm py-4">
            <p className="text-lg mb-2">No moments yet! 💭</p>
            <p className="text-xs">Click a button above to record the first care moment</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
            {events.map(event => (
              <div key={event.id} className="flex gap-3 text-sm bg-white/70 p-3 rounded-lg border border-white shadow-sm hover:shadow-md transition">
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
