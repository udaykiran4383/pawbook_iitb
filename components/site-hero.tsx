import { Heart } from 'lucide-react';
import { campus } from '@/lib/campus';

interface SiteHeroProps {
  /**
   * Live counts. Omitted before the store has hydrated, so the hero can render
   * on the server and during first paint with placeholders in place of numbers.
   */
  stats?: {
    activeAnimals: number;
    totalLikes: number;
    totalMemories: number;
  };
}

/**
 * The masthead: name, tagline and the three campus counts.
 *
 * This is deliberately free of client state so it can be server-rendered. The
 * page used to return an empty <main> until the persisted store had hydrated,
 * which meant the first thing anyone saw — and the only thing a crawler or a
 * link preview ever saw — was a blank gradient with no heading at all.
 */
export default function SiteHero({ stats }: SiteHeroProps) {
  return (
    <section className="pt-8 md:pt-10 pb-6 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        {/* Logo area */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-5xl">🐾</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            PawBook
          </h1>
        </div>
        <p className="text-sm font-bold text-primary tracking-widest uppercase mb-3">{campus.name}</p>
        <p className="text-xl md:text-2xl text-muted-foreground mb-2 handwritten">
          Every campus animal has a story
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          A digital memory book-
          Share photos, memories, and care for them together. 📸🐕🐱
        </p>

        {/* Stats bar */}
        <div className="flex justify-center gap-4 sm:gap-6 mt-5 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats ? stats.activeAnimals : '—'}</p>
            <p className="text-xs text-muted-foreground">Active Friends</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats ? stats.totalLikes : '—'}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
              <Heart size={10} className="text-red-400" /> Total Loves
            </p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats ? stats.totalMemories : '—'}</p>
            <p className="text-xs text-muted-foreground">Memories Shared</p>
          </div>
        </div>
      </div>
    </section>
  );
}
