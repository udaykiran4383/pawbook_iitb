'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { campusSlugFromLocation, switchCampusStore } from '@/lib/animal-store';
import { campus as defaultCampus } from '@/lib/campus';
import { DEFAULT_CAMPUS_SLUG, findCampus, type RegisteredCampus } from '@/lib/campuses';

interface CampusContextValue {
  campus: RegisteredCampus;
  slug: string;
  /** '' for the default campus, '/c/<slug>' for the others. */
  basePath: string;
}

const CampusContext = createContext<CampusContextValue>({
  campus: { ...defaultCampus, slug: DEFAULT_CAMPUS_SLUG, city: 'Mumbai', state: 'Maharashtra' },
  slug: DEFAULT_CAMPUS_SLUG,
  basePath: '',
});

/**
 * Makes one campus the active one for everything beneath it.
 *
 * Switching campus swaps which persisted row the store reads and writes —
 * each campus has its own animals — and clears the in-memory list first, so a
 * student opening IIT Madras never sees IIT Bombay's dogs for a second while
 * the real list loads. The default campus keeps the original storage key so
 * nothing that exists today moves.
 */
export function CampusProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const campus = findCampus(slug) ?? findCampus(DEFAULT_CAMPUS_SLUG)!;
  const activeSlug = campus.slug;
  const basePath = activeSlug === DEFAULT_CAMPUS_SLUG ? '' : `/c/${activeSlug}`;
  const lastSlug = useRef<string | null>(null);

  // Providers nest: the root layout provides the default campus and
  // /c/[campus]/layout provides the real one inside it. React runs the inner
  // effect first and the outer one last, so if every provider switched the
  // store, the outer default would win and every campus would show IIT
  // Bombay's animals. Only the provider that matches the URL may switch.
  useEffect(() => {
    if (lastSlug.current === activeSlug) return;
    lastSlug.current = activeSlug;
    if (campusSlugFromLocation() !== activeSlug) return;
    switchCampusStore(activeSlug);
  }, [activeSlug]);

  return (
    <CampusContext.Provider value={{ campus, slug: activeSlug, basePath }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus(): CampusContextValue {
  return useContext(CampusContext);
}
