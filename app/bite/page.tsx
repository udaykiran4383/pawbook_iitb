import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BiteFirstAid from '@/components/bite-first-aid';
import { DEFAULT_CAMPUS_SLUG, campusBasePath, findCampus } from '@/lib/campuses';

interface PageProps {
  params?: Promise<{ campus?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = (await params)?.campus ?? DEFAULT_CAMPUS_SLUG;
  const campus = findCampus(slug) ?? findCampus(DEFAULT_CAMPUS_SLUG)!;
  return {
    title: `Bitten? What to do now · PawBook ${campus.shortName}`,
    description:
      'Wash the wound for 15 minutes under running water with soap, then go to a hospital today for the rabies vaccine. First-aid steps in English, Hindi and Marathi.',
  };
}

// Fully static: no data, no network. This page has to work at a gate at 2 a.m.
export const dynamic = 'force-static';

export default async function BitePage({ params }: PageProps) {
  const slug = (await params)?.campus ?? DEFAULT_CAMPUS_SLUG;
  const basePath = campusBasePath(findCampus(slug)?.slug ?? DEFAULT_CAMPUS_SLUG);
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6">
        <Link
          href={basePath || '/'}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition mb-4"
        >
          <ArrowLeft size={16} />
          PawBook
        </Link>
        <BiteFirstAid />
      </div>
    </main>
  );
}
