import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BiteFirstAid from '@/components/bite-first-aid';
import { appName } from '@/lib/campus';

export const metadata: Metadata = {
  title: `Bitten? What to do now · ${appName}`,
  description:
    'Wash the wound for 15 minutes under running water with soap, then go to a hospital today for the rabies vaccine. First-aid steps in English, Hindi and Marathi.',
};

// Fully static: no data, no network. This page has to work at a gate at 2 a.m.
export const dynamic = 'force-static';

export default function BitePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6">
        <Link
          href="/"
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
