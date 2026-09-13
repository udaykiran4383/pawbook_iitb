import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, School } from 'lucide-react';
import { CAMPUSES, campusBasePath } from '@/lib/campuses';

export const metadata: Metadata = {
  title: 'Campuses · PawBook',
  description: 'PawBook runs for every campus that wants it. Pick yours, or add it.',
};

/**
 * The picker. Every campus in the registry, and the one-paragraph instruction
 * for adding a new one. Adding is a pull request on purpose — see
 * lib/campuses.ts for why.
 */
export default function CampusesPage() {
  const byState = new Map<string, typeof CAMPUSES>();
  for (const c of CAMPUSES) byState.set(c.state, [...(byState.get(c.state) ?? []), c]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowLeft size={16} />
          PawBook
        </Link>

        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <School size={26} />
          Which campus?
        </h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          One PawBook, every campus. Each has its own animals, map, rules and register.
        </p>

        {Array.from(byState.entries()).sort().map(([state, list]) => (
          <section key={state} className="mt-6">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">{state}</h2>
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={campusBasePath(c.slug) || '/'}
                    className="block bg-card border border-border rounded-2xl px-4 py-3 hover:shadow-md active:scale-[0.99] transition"
                  >
                    <p className="font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.place ?? c.city}{c.welfareGroup ? ` · ${c.welfareGroup}` : ''}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-10 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-4">
          <h2 className="font-bold text-foreground">Your campus isn&apos;t here?</h2>
          <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
            Adding one is a ten-minute pull request: copy the template at the bottom of{' '}
            <code className="text-xs bg-card px-1.5 py-0.5 rounded">lib/campuses.ts</code>, fill in your
            campus name, a centre point and your area names, and open the PR. There is no sign-up form on
            purpose — it keeps out junk without keeping out anyone real.
          </p>
          <a
            href="https://github.com/udaykiran4383/pawbook_iitb/blob/main/lib/campuses.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm font-bold text-amber-800 dark:text-amber-300 underline underline-offset-2"
          >
            Open the registry on GitHub ↗
          </a>
        </section>
      </div>
    </main>
  );
}
