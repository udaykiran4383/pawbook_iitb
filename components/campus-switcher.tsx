'use client';

import Link from 'next/link';
import { School } from 'lucide-react';
import { useCampus } from '@/components/campus-provider';

/** Shows which campus you are on and links to the picker. */
export default function CampusSwitcher() {
  const { campus } = useCampus();
  return (
    <Link
      href="/campuses"
      className="fixed top-3 left-3 z-50 h-11 px-3 rounded-full bg-card border border-border shadow-sm hover:shadow-md active:scale-95 transition flex items-center gap-1.5 text-foreground max-w-[11rem]"
      title="Switch campus"
    >
      <School size={16} aria-hidden="true" className="flex-shrink-0" />
      <span className="text-xs font-bold truncate">{campus.shortName}</span>
    </Link>
  );
}
