'use client';

import { useEffect, useState } from 'react';
import { Eye, Check } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';
import { campus } from '@/lib/campus';

interface QuickSightingProps {
  animalId: number;
  animalName: string;
  homeZone: string;
}

/**
 * The one-tap "I'm seeing them now" that a QR scan should land on.
 *
 * Someone who has just scanned a poster is standing next to the animal, on a
 * phone, probably with one hand. This asks for exactly one thing — which area —
 * and defaults it to the animal's home zone so the common case is a single tap.
 * The zone is free text and nothing else is captured.
 */
export default function QuickSighting({ animalId, animalName, homeZone }: QuickSightingProps) {
  const [zone, setZone] = useState(homeZone);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  // The store hydrates from the network after mount; don't offer a button that
  // would write into an empty state.
  useEffect(() => {
    const unsub = useAnimalStore.persist?.onFinishHydration?.(() => setReady(true));
    if (useAnimalStore.persist?.hasHydrated?.()) setReady(true);
    return () => unsub?.();
  }, []);

  const known = useAnimalStore((s) => s.animals.some((a) => a.id === animalId));

  if (!ready || !known) return null;

  const submit = () => {
    useAnimalStore.getState().logSighting(animalId, zone);
    setDone(true);
  };

  // Presence needs absence: "I looked at the usual spot and they weren't there"
  // is the only thing that makes "not seen in 11 days" mean anything.
  const notThere = () => {
    useAnimalStore.getState().logAbsence(animalId, zone);
    setDone(true);
  };

  if (done) {
    return (
      <div className="mt-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
        <p className="text-sm font-bold text-green-800 dark:text-green-300 flex items-center justify-center gap-1.5">
          <Check size={16} />
          Logged — thank you for checking on {animalName} 🐾
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white/90 dark:bg-card border-2 border-amber-200 dark:border-border rounded-2xl p-4">
      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Eye size={16} />
        Seeing {animalName} right now?
      </p>
      <div className="flex gap-2 mt-2">
        <input
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          list="pawbook-zones"
          aria-label="Where are they"
          placeholder="Where? e.g. H11"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition whitespace-nowrap"
        >
          Log sighting
        </button>
      </div>
      <button
        type="button"
        onClick={notThere}
        className="mt-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        I looked here and they weren&apos;t around
      </button>
      {/* Suggestions only; free text is still allowed. */}
      <datalist id="pawbook-zones">
        {campus.zones.map((z) => <option key={z} value={z} />)}
      </datalist>
      <p className="text-[10px] text-muted-foreground mt-1.5">
        Just the area — no exact location is ever stored.
      </p>
    </div>
  );
}
