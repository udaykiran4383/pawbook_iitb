'use client';

import { useState } from 'react';
import { FileDown, ClipboardCopy, Check } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';
import { buildRegisterBundle } from '@/lib/export';
import { useCampus } from '@/components/campus-provider';

/**
 * Downloads the register the institution can file.
 *
 * Everything is generated in the browser from the data already loaded — no
 * server call, nothing new stored — and every file omits coordinates and
 * contributor identities by construction.
 */
export default function ExportRegister() {
  const { campus } = useCampus();
  const animals = useAnimalStore((s) => s.animals);
  const [copied, setCopied] = useState(false);

  if (!Array.isArray(animals) || animals.length === 0) return null;

  const stamp = new Date().toISOString().slice(0, 10);
  const slug = campus.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const download = (name: string, content: string, type = 'text/csv') => {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // One bundle, generated together, so the hashes on the cover sheet are the
  // hashes of exactly the files downloaded.
  const bundle = () => buildRegisterBundle(animals, campus.name, campus.estimatedPopulation);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText((await bundle()).summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the downloads still work.
    }
  };

  return (
    <section className="px-4 mb-8">
      <div className="max-w-2xl mx-auto bg-white/80 dark:bg-card border border-border rounded-3xl p-4">
        <p className="text-sm font-bold text-foreground">Register for the institution</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          The same records as spreadsheets, in the vocabulary survey teams use — for a Nodal
          Officer, an affidavit, or a municipal survey. Zones only, no coordinates, no names.
          The cover sheet carries a SHA-256 of each file, so what is filed can be checked later.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={async () => download(`pawbook-${slug}-register-${stamp}.csv`, (await bundle()).register)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-foreground text-background rounded-full px-3 py-2 active:scale-95 transition"
          >
            <FileDown size={14} /> Register
          </button>
          <button
            type="button"
            onClick={async () => download(`pawbook-${slug}-sightings-${stamp}.csv`, (await bundle()).sightings)}
            className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2 active:scale-95 transition"
          >
            <FileDown size={14} /> Sightings
          </button>
          <button
            type="button"
            onClick={async () => download(`pawbook-${slug}-medical-${stamp}.csv`, (await bundle()).medical)}
            className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2 active:scale-95 transition"
          >
            <FileDown size={14} /> Medical
          </button>
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2 active:scale-95 transition"
          >
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />} {copied ? 'Copied' : 'Copy cover sheet'}
          </button>
        </div>
      </div>
    </section>
  );
}
