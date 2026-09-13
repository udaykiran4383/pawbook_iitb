import type { Metadata } from 'next';
import OfficialsDashboard from '@/components/officials-dashboard';
import { DEFAULT_CAMPUS_SLUG, findCampus } from '@/lib/campuses';

interface PageProps {
  params?: Promise<{ campus?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = (await params)?.campus ?? DEFAULT_CAMPUS_SLUG;
  const campus = findCampus(slug) ?? findCampus(DEFAULT_CAMPUS_SLUG)!;
  return {
    title: `Institution view · PawBook ${campus.shortName}`,
    robots: { index: false, follow: false },
  };
}

export default function OfficialsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <OfficialsDashboard />
      </div>
    </main>
  );
}
