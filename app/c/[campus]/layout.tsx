import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CampusProvider } from '@/components/campus-provider';
import { findCampus } from '@/lib/campuses';

interface Props {
  params: Promise<{ campus: string }>;
  children: React.ReactNode;
}
// Next's generated route types are regenerated on build; params is typed
// loosely there, so the handlers below read the slug defensively.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { campus: slug } = await params;
  const campus = findCampus(slug);
  if (!campus) return {};
  return {
    title: `PawBook ${campus.shortName} — Instagram for Campus Animals`,
    description: `A digital memory book for the beloved animals of ${campus.name}. Share photos, memories, and care for campus animals together. Every animal has a story. 🐾`,
  };
}

/**
 * /c/<slug>: the same app, for another campus. The provider beneath swaps the
 * store to that campus's own row; everything else reads the campus from
 * context and just works.
 */
export default async function CampusLayout({ params, children }: Props) {
  const { campus: slug } = await params;
  if (!findCampus(slug)) notFound();
  return <CampusProvider slug={slug}>{children}</CampusProvider>;
}
