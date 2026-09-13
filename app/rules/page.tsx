import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DEFAULT_CAMPUS_SLUG, campusBasePath, findCampus } from '@/lib/campuses';

interface PageProps {
  params?: Promise<{ campus?: string }>;
}

async function resolve(params?: PageProps['params']) {
  const slug = (await params)?.campus ?? DEFAULT_CAMPUS_SLUG;
  return findCampus(slug) ?? findCampus(DEFAULT_CAMPUS_SLUG)!;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const campus = await resolve(params);
  return {
    title: `How we care for campus animals · PawBook ${campus.shortName}`,
    description: `Shared ground rules for feeding and looking after the animals of ${campus.name} — fixed spots, fixed times, cleared bowls, and what to do if someone is hurt.`,
  };
}

/*
 * These are community guidelines, written in the shape that the institution
 * itself and the courts have asked for. They are deliberately not legal
 * statements: the relevant orders are live litigation, and a rules page that
 * quotes law goes out of date the next hearing. What it borrows instead is the
 * practical hygiene regime that has worked elsewhere for decades — Japan's
 * 地域猫 (community cat) guidelines from Tama and Sakai, and the same rules
 * Istanbul's municipality fell back to in 2025.
 *
 * The page exists because a student-led animal body on a campus is expected to
 * be able to show what its rules are. This is that artefact.
 */

const RULES = [
  {
    title: 'Feed at the fixed spot, at the fixed time',
    body: 'The campus has designated feeding spots. Use those, at the agreed hours, and nowhere else — not at hostel doors, not at the mess, not on paths. An animal fed in one place waits in one place.',
  },
  {
    title: 'Only what will be eaten now',
    body: 'Put out an amount the animals present will finish in about twenty minutes. If food is left after that, next time put out less. Overfeeding draws animals from elsewhere and grows the group — the one thing every programme worldwide agrees makes life worse for the animals.',
  },
  {
    title: 'Clear up before you leave',
    body: 'Take bowls, wrappers and uneaten food with you. Nothing stays on the ground. Water is the exception: a clean bowl of water can be left at a fixed spot and refreshed daily.',
  },
  {
    title: 'Log it',
    body: 'Mark the animal as fed in PawBook. That is how the next person knows not to feed them again an hour later, and how the campus can show that care is happening in an orderly way.',
  },
  {
    title: 'Look while you feed',
    body: 'Feeding time is the best moment to notice a limp, a wound, patchy fur, or a collar that has come off. The survey card in each profile takes thirty seconds. Tick what you see; skip what you are not sure of.',
  },
  {
    title: 'If someone is hurt',
    body: 'File an emergency report in PawBook and say where. Do not try to lift or restrain an injured animal on your own. If you are bitten or scratched: wash the wound under running water with soap for fifteen minutes, then go to a hospital the same day — no exceptions, however small it looks. The full steps, in Hindi and Marathi too, are on the Bitten? page.',
  },
  {
    title: 'Keep the animals out of the record',
    body: 'Never post exact locations of animals anywhere public. PawBook itself stores only a rough area. Anyone who wants to harm an animal starts with a map.',
  },
  {
    title: 'Respect people who are not comfortable',
    body: 'Not everyone on campus likes dogs, and some people are afraid of them. Do not encourage animals into buildings, hostels, labs or the mess. The agreement that lets animals stay depends on this.',
  },
];

export default async function RulesPage({ params }: PageProps) {
  const campus = await resolve(params);
  const basePath = campusBasePath(campus.slug);
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-background dark:via-background dark:to-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={basePath || '/'}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to PawBook {campus.shortName}
        </Link>

        <h1 className="text-3xl font-bold text-foreground">How we care for campus animals</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Eight rules. They come from community-cat programmes that have run for decades in
          Japanese cities and from what the campus itself has asked for. They are here so that
          anyone — a first-year, a security guard, the Dean&apos;s office — can see what looking
          after these animals is supposed to look like.
        </p>

        <ol className="mt-6 space-y-4">
          {RULES.map((rule, index) => (
            <li
              key={rule.title}
              className="bg-white/90 dark:bg-card border border-amber-200 dark:border-border rounded-2xl p-4"
            >
              <h2 className="font-bold text-foreground flex items-baseline gap-2">
                <span className="text-amber-700 dark:text-amber-400 tabular-nums">{index + 1}.</span>
                {rule.title}
              </h2>
              <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed">{rule.body}</p>
            </li>
          ))}
        </ol>

        <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
          These are community guidelines, not legal advice. Official requirements for animals on
          campus are set by the Institute and by the courts, and change; if you are organising
          feeding as a group, ask {campus.authorityOffice} what is currently required of you
          before you start.
        </p>
      </div>
    </main>
  );
}
