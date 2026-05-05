'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dice5, Sparkles, Trophy } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';

const kindnessIdeas = [
  'Refill one water bowl today.',
  'Check on one animal that has not been seen recently.',
  'Share a positive memory and tag the location.',
  'Invite one friend to join PawBook care updates.',
  'Capture one clear profile photo for identification.',
];

type TipPayload = {
  tip: string;
  badge: string;
  date: string;
};

export default function PlayfulFeatures() {
  const animalsState = useAnimalStore((state) => state.animals);
  const animals = Array.isArray(animalsState) ? animalsState : [];
  const [randomIdea, setRandomIdea] = useState(kindnessIdeas[0]);
  const [dailyTip, setDailyTip] = useState<TipPayload | null>(null);

  useEffect(() => {
    const localTips = [
      { tip: 'Offer clean water near common resting spots.', badge: 'Care Hero' },
      { tip: 'Share one happy memory in PawBook today.', badge: 'Paw Pal' },
      { tip: 'Check existing profiles before adding new animals.', badge: 'Friend of Strays' },
      { tip: 'Carry a small packet of pet-safe biscuits on campus.', badge: 'Campus Kindness Star' },
    ];
    const pick = localTips[Math.floor(Math.random() * localTips.length)];
    setDailyTip({ ...pick, date: new Date().toISOString() });
  }, []);

  const topAnimals = useMemo(
    () => [...animals].sort((a, b) => b.likes - a.likes).slice(0, 3),
    [animals]
  );

  return (
    <section className="max-w-6xl mx-auto px-4 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-3xl border-2 border-amber-200/70 bg-white/80 p-4 md:p-5 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Daily Friendship Mission</p>
          <p className="text-base font-semibold text-foreground mt-2">{dailyTip?.tip || 'Loading today’s tip...'}</p>
          <p className="text-xs text-muted-foreground mt-2">Badge unlock: {dailyTip?.badge || 'Care Hero'}</p>
        </div>

        <div className="rounded-3xl border-2 border-pink-200/70 bg-white/80 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">Random Kindness Challenge</p>
            <button
              onClick={() => setRandomIdea(kindnessIdeas[Math.floor(Math.random() * kindnessIdeas.length)])}
              className="inline-flex items-center gap-1 rounded-full border border-pink-300 px-3 py-1 text-xs font-bold text-pink-700 hover:bg-pink-50 active:scale-95 transition"
            >
              <Dice5 size={14} />
              Spin
            </button>
          </div>
          <p className="text-base font-semibold text-foreground mt-3">{randomIdea}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Sparkles size={12} />
            Small actions make campus safer for every animal.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-blue-200/70 bg-white/80 p-4 md:p-5 shadow-sm">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">PawBook Hall of Fame</p>
          <div className="space-y-2 mt-3">
            {topAnimals.map((animal, index) => (
              <div key={animal.id} className="flex items-center justify-between rounded-xl bg-blue-50/80 px-3 py-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  #{index + 1} {animal.name}
                </p>
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <Trophy size={12} />
                  {animal.likes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
