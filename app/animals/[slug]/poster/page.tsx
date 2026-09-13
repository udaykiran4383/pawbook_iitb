import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, Printer } from 'lucide-react';
import { animalIdFromSlug, animalPath } from '@/lib/animal-slug';
import { getAnimalById } from '@/lib/state-server';
import { getAnimalAvatar } from '@/lib/animal-avatar';
import { toPublicAnimal, type PublicAnimal } from '@/lib/public-view';
import { campus, appName } from '@/lib/campus';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: `Printable card · ${appName}`,
  // A poster is for printing and pinning up, not for indexing.
  robots: { index: false, follow: false },
};

function siteOrigin(): string {
  return campus.siteUrl;
}

// A poster goes on a public wall, so it gets the same allowlisted view.
async function loadAnimal(slug: string): Promise<PublicAnimal | null> {
  const id = animalIdFromSlug(slug);
  if (id === null) return null;
  const animal = await getAnimalById(id);
  return animal ? toPublicAnimal(animal) : null;
}

export default async function PosterPage({ params }: PageProps) {
  const { slug } = await params;
  const animal = await loadAnimal(slug);
  if (!animal) notFound();

  const url = `${siteOrigin()}${animalPath(animal)}`;

  // Level M survives a bit of rain and scuffing on a pinned-up sheet while
  // staying sparse enough to scan from a phone held at arm's length.
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: '#2B1D14', light: '#0000' },
  });

  /**
   * Deliberately not hard-coded: a wrong number on a poster about an injured
   * animal is worse than no number. Set NEXT_PUBLIC_EMERGENCY_CONTACT once the
   * campus/NGO number has actually been dialled and confirmed; until then the
   * card prints a blank line for whoever puts it up to fill in by hand.
   */
  const emergencyContact = campus.emergencyContact ?? null;

  return (
    <>
      <style>{`
        @page { size: A5; margin: 10mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .poster { box-shadow: none !important; border-color: #2B1D14 !important;
                    background: #fff !important; color: #2B1D14 !important; }
          .poster * { color: #2B1D14 !important; }
        }
      `}</style>

      <main className="min-h-screen bg-amber-50/60 py-8 px-4">
        <div className="max-w-[420px] mx-auto">
          <div className="no-print flex items-center justify-between mb-4">
            <Link
              href={animalPath(animal)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft size={16} />
              Back to {animal.name}
            </Link>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Printer size={14} />
              Ctrl/Cmd + P to print
            </span>
          </div>

          {/* Always light: this sheet is meant to come out of a printer, so it
              must not follow the viewer's dark theme. */}
          <article className="poster bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-700">
              PawBook · {campus.name}
            </p>

            <img
              src={getAnimalAvatar(animal, 480)}
              alt={`${animal.name}, a campus ${animal.animal_type ?? 'animal'}`}
              className="w-40 h-40 rounded-full object-cover border-4 border-amber-200 mx-auto mt-4"
            />

            <h1 className="text-4xl font-bold text-foreground mt-4">{animal.name}</h1>
            {animal.location && (
              <p className="text-sm font-bold text-muted-foreground mt-1">{animal.location}</p>
            )}

            {animal.description && (
              <p className="text-sm text-foreground mt-3 leading-relaxed">{animal.description}</p>
            )}

            {Array.isArray(animal.personality_tags) && animal.personality_tags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {animal.personality_tags.join(' · ')}
              </p>
            )}

            <div className="mt-5 flex items-center gap-4 text-left">
              <div
                className="w-28 h-28 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Scan to meet {animal.name}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  See their story, check when they were last fed, and add what you know.
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 break-all">{url}</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-amber-200 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                If {animal.name} is hurt
              </p>
              {emergencyContact ? (
                <p className="text-base font-bold text-foreground mt-1">{emergencyContact}</p>
              ) : (
                <p className="text-sm text-foreground mt-2">
                  Campus contact:{' '}
                  <span className="inline-block border-b border-dotted border-foreground/50 w-40 align-baseline" />
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Wash any bite or scratch with soap under running water for 15 minutes and go to a
                hospital the same day.
              </p>
            </div>
          </article>

          <p className="no-print text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Prints on A5. The QR points at this animal&apos;s page, so it keeps working even if
            they are renamed.
          </p>
        </div>
      </main>
    </>
  );
}
