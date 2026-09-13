'use client';

import { useEffect, useState } from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';
import { useCampus } from '@/components/campus-provider';
import {
  pickFollowUp,
  readMySightings,
  rememberMySighting,
  forgetMySighting,
  shownToday,
  markShownToday,
  type FollowUp,
} from '@/lib/follow-up';

/**
 * "Last time you saw Bruno near H11. Still around?"
 *
 * Shown once a day at most, to the device that logged the sighting, a week to
 * a month later. Three answers, one tap each. "Still there" is a sighting,
 * "Haven't seen them" is an absence — the signal the app otherwise never gets
 * — and "Not sure" is just a dismissal, because a guess is worse than nothing.
 */
export default function FollowUpPrompt() {
  // Keeps the campus context intact; the store already holds this campus's animals.
  useCampus();
  const [ready, setReady] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);

  // Wait for the persisted store, as QuickSighting does: before hydration the
  // list is empty or demo data and there is nothing honest to ask about.
  useEffect(() => {
    const unsub = useAnimalStore.persist?.onFinishHydration?.(() => setReady(true));
    if (useAnimalStore.persist?.hasHydrated?.()) setReady(true);
    return () => unsub?.();
  }, []);

  const animals = useAnimalStore((s) => s.animals);

  useEffect(() => {
    if (!ready || followUp) return;
    if (shownToday()) return;
    const pick = pickFollowUp(Array.isArray(animals) ? animals : [], readMySightings());
    if (!pick) return;
    markShownToday();
    setFollowUp(pick);
  }, [ready, animals, followUp]);

  if (!followUp) return null;

  const { animal, zone } = followUp;

  const stillThere = () => {
    useAnimalStore.getState().logSighting(animal.id, zone);
    // A fresh sighting from this device, so we can ask again in a week or so.
    rememberMySighting(animal.id);
    setAnswered(`Logged — thank you for keeping an eye on ${animal.name} 🐾`);
  };

  const notSeen = () => {
    useAnimalStore.getState().logAbsence(animal.id, zone);
    forgetMySighting(animal.id);
    setAnswered(`Noted. If ${animal.name} turns up, the profile has a one-tap sighting.`);
  };

  const notSure = () => {
    forgetMySighting(animal.id);
    setAnswered(null);
    setFollowUp(null);
  };

  return (
    <section className="px-4 mb-6">
      <div className="max-w-2xl mx-auto bg-white/80 dark:bg-card border-2 border-amber-200 dark:border-border rounded-3xl p-4 shadow-sm">
        {answered ? (
          <p role="status" className="text-sm font-bold text-green-800 dark:text-green-300 text-center">
            {answered}
          </p>
        ) : (
          <>
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <MessageCircleQuestion size={16} className="flex-shrink-0" />
              Last time you saw {animal.name} near {zone}. Still around?
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={stillThere}
                className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition"
              >
                Still there
              </button>
              <button
                type="button"
                onClick={notSeen}
                className="bg-white dark:bg-muted/40 border border-gray-200 dark:border-border text-foreground font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition"
              >
                Haven&apos;t seen them
              </button>
              <button
                type="button"
                onClick={notSure}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-2"
              >
                Not sure
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
