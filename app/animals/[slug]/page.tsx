import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Heart, Clock, Eye, UtensilsCrossed, Printer } from 'lucide-react';
import { animalIdFromSlug, animalPath } from '@/lib/animal-slug';
import { getAnimalById } from '@/lib/state-server';
import { getAnimalAvatar } from '@/lib/animal-avatar';
import { optimizeImageUrl } from '@/lib/image-url';
import { formatTimeSince } from '@/lib/care-tracking';
import type { Animal } from '@/lib/demo-data';

// The underlying row changes as students log care, so don't serve a stale page
// for long — but do let the CDN absorb a burst of QR scans.
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadAnimal(slug: string): Promise<Animal | null> {
  const id = animalIdFromSlug(slug);
  if (id === null) return null;
  return getAnimalById(id);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const animal = await loadAnimal(slug);

  if (!animal) {
    return { title: 'Animal not found · PawBook IITB' };
  }

  const where = animal.location ? ` · ${animal.location}` : '';
  const description =
    animal.description?.trim() ||
    `Meet ${animal.name}, a campus ${animal.animal_type ?? 'animal'} at IIT Bombay.`;
  const image = animal.profile_image ? optimizeImageUrl(animal.profile_image, { width: 1200 }) : null;

  return {
    title: `${animal.name}${where} · PawBook IITB`,
    description,
    openGraph: {
      title: `${animal.name} · PawBook IITB`,
      description,
      type: 'profile',
      url: animalPath(animal),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${animal.name} · PawBook IITB`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/80 dark:bg-card border border-amber-100 rounded-2xl px-4 py-3">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      {/* Plain and unornamented: these are the facts people came to check. */}
      <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

export default async function AnimalPage({ params }: PageProps) {
  const { slug } = await params;
  const animal = await loadAnimal(slug);

  if (!animal) notFound();

  const isDeceased = animal.status === 'deceased';
  const memories = Array.isArray(animal.memories) ? animal.memories : [];
  const comments = Array.isArray(animal.comments) ? animal.comments : [];

  const seenAt = animal.last_seen ? new Date(animal.last_seen) : null;
  const fedAt = animal.last_fed ? new Date(animal.last_fed) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-background dark:via-background dark:to-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft size={16} />
          All campus friends
        </Link>

        <article
          className={`bg-white/90 dark:bg-card rounded-3xl border-2 p-6 shadow-sm ${
            isDeceased ? 'border-purple-200' : 'border-amber-200'
          }`}
        >
          <header className="flex items-center gap-4">
            <img
              src={getAnimalAvatar(animal, 320)}
              alt={`${animal.name}, a campus ${animal.animal_type ?? 'animal'}`}
              className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow ${
                isDeceased ? 'grayscale-[30%]' : ''
              }`}
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground">{animal.name}</h1>
              {animal.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={14} className="flex-shrink-0" />
                  {animal.location}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Heart size={14} className="text-red-400 flex-shrink-0" />
                <span className="tabular-nums">{animal.likes ?? 0}</span> loves
              </p>
            </div>
          </header>

          {isDeceased && (
            <p className="mt-4 text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
              🕊️ Remembering {animal.name}
              {animal.death_date
                ? ` · ${new Date(animal.death_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}`
                : ''}
            </p>
          )}

          {animal.description && (
            <p className="mt-4 text-foreground leading-relaxed">{animal.description}</p>
          )}

          {Array.isArray(animal.personality_tags) && animal.personality_tags.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-4">
              {animal.personality_tags.map((tag) => (
                <li
                  key={tag}
                  className="text-xs font-bold bg-amber-100 text-amber-900 rounded-full px-3 py-1"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {!isDeceased && (
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Fact
                icon={<Eye size={12} />}
                label="Last seen"
                value={seenAt ? formatTimeSince(seenAt) : 'No sightings yet'}
              />
              <Fact
                icon={<UtensilsCrossed size={12} />}
                label="Last fed"
                value={fedAt ? formatTimeSince(fedAt) : 'Not recorded'}
              />
            </div>
          )}

          {memories.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold text-foreground mb-2">Memories</h2>
              <ul className="space-y-3">
                {memories.map((memory: any, index: number) => (
                  <li
                    key={memory?.id ?? index}
                    className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3"
                  >
                    <p className="text-sm text-foreground">{memory?.content ?? memory?.text}</p>
                    {memory?.author && (
                      <p className="text-xs text-muted-foreground mt-1">— a student</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {comments.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold text-foreground mb-2">
                Comments ({comments.length})
              </h2>
              <ul className="space-y-2">
                {comments.map((comment: any, index: number) => (
                  <li key={comment?.id ?? index} className="text-sm">
                    <span className="font-bold text-foreground">A student</span>{' '}
                    <span className="text-foreground">{comment?.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="mt-6 pt-4 border-t border-amber-100">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock size={12} />
              Added {animal.created_at ? formatTimeSince(new Date(animal.created_at)) : 'a while ago'}
              {/*
                Contributor and feeder names are deliberately withheld on this
                public, linkable page. Para 74 of 2026 INSC 506 (19 May 2026)
                makes campus animal groups file a liability affidavit, which
                turns "who feeds this dog" into a legal and personal-safety
                question rather than a credit line. WAG, the animal welfare
                group actually operating at IITB, publishes no member directory
                and renders even its email as an image. Names still appear
                inside the app to the people contributing; they do not belong on
                a page anyone can find, scrape, or reach from a printed QR code.
              */}
            </p>
          </footer>
        </article>

        <div className="text-center mt-6 space-y-3">
          <Link
            href={`${animalPath(animal)}/poster`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded-full px-4 py-2 transition"
          >
            <Printer size={15} />
            Printable card with QR
          </Link>
          <p className="text-xs text-muted-foreground">
            Open PawBook to add a photo, log a feed, or share a memory.
          </p>
        </div>
      </div>
    </main>
  );
}
