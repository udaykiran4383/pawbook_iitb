'use client';

import { useMemo } from 'react';
import { buildLifeStory, type StoryEntry } from '@/lib/life-story';
import { optimizeImageUrl } from '@/lib/image-url';
import type { Animal } from '@/lib/demo-data';

interface LifeStoryProps {
  animal: Animal;
}

const KIND_MARK: Record<StoryEntry['kind'], { emoji: string; tone: string }> = {
  joined: { emoji: '🎒', tone: 'text-amber-700 dark:text-amber-300' },
  memory: { emoji: '💭', tone: 'text-foreground' },
  medical: { emoji: '🏥', tone: 'text-blue-700 dark:text-blue-300' },
  passed: { emoji: '🕊️', tone: 'text-purple-700 dark:text-purple-300' },
  graduated: { emoji: '🎓', tone: 'text-green-700 dark:text-green-300' },
};

const MEMORY_EMOJI: Record<string, string> = {
  happy: '😊', funny: '😂', touching: '💕', tribute: '🌹', goodbye: '👋',
};

function dayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * The scrapbook view: everything that happened, in order, grouped by year.
 * Facts (joined, medical, passed) are set plainly; memories are the warm part.
 */
export default function LifeStory({ animal }: LifeStoryProps) {
  const years = useMemo(() => buildLifeStory(animal), [animal]);

  if (years.length === 0) return null;

  return (
    <div className="space-y-5">
      {years.map(({ year, entries }) => (
        <section key={year}>
          <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">{year}</h3>
          <ol className="relative border-l-2 border-border ml-2 space-y-3">
            {entries.map((e) => {
              const mark = KIND_MARK[e.kind];
              return (
                <li key={e.id} className="pl-4 relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center text-xs"
                  >
                    {e.kind === 'memory' && e.memory ? MEMORY_EMOJI[e.memory.memory_type] ?? mark.emoji : mark.emoji}
                  </span>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{e.kind === 'graduated' ? '' : dayMonth(e.at)}</p>
                  {e.kind === 'memory' ? (
                    <div className="bg-white/70 dark:bg-card border border-border rounded-xl p-3 mt-0.5">
                      {e.photo_url && (
                        <img
                          src={optimizeImageUrl(e.photo_url, { width: 600 })}
                          alt=""
                          className="w-full h-36 object-cover rounded-lg mb-2"
                        />
                      )}
                      <p className="text-sm text-foreground leading-relaxed">{e.title}</p>
                      {e.memory?.author && (
                        <p className="text-[10px] text-muted-foreground mt-1">— {e.memory.author}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <p className={`text-sm font-bold ${mark.tone}`}>{e.title}</p>
                      {e.body && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{e.body}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
