'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';
import type { Animal } from '@/lib/demo-data';
import { getMapLayout, scatter, zoneFor, type MapZone } from '@/lib/campus-map';
import { getAnimalAvatar } from '@/lib/animal-avatar';
import { getPresence } from '@/lib/presence';

// MapLibre reads `window` on import; load it only on the client, only when shown.
const GeoCampusMap = dynamic(() => import('@/components/geo-campus-map'), {
  ssr: false,
  loading: () => <div className="h-[520px] rounded-3xl bg-muted animate-pulse" aria-hidden="true" />,
});

interface CampusMapProps {
  animals: Animal[];
  onOpenProfile: (animal: Animal) => void;
}

/**
 * The scrapbook map. Hand-drawn feel: wobbly blob zones in pastel, dashed
 * roads, the lake, and each animal as a little round photo sitting in the area
 * people know them by. Tapping one opens their profile.
 *
 * Deliberately not a real map. See lib/campus-map.ts for why.
 */
export default function CampusMap({ animals, onOpenProfile }: CampusMapProps) {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<'sketch' | 'geo'>('sketch');
  const layout = useMemo(() => getMapLayout(), []);
  const hasGeo = layout.zones.some((z) => z.geo);

  const placed = useMemo(() => {
    const byZone = new Map<string, Animal[]>();
    const elsewhere: Animal[] = [];
    for (const a of animals) {
      if (a.status === 'deceased' || a.status === 'adopted') continue;
      const z = zoneFor(a.location, layout);
      if (z) byZone.set(z.id, [...(byZone.get(z.id) ?? []), a]);
      else elsewhere.push(a);
    }
    const pins: Array<{ animal: Animal; x: number; y: number; zone: MapZone }> = [];
    for (const zone of layout.zones) {
      const list = byZone.get(zone.id) ?? [];
      list.forEach((animal, i) => pins.push({ animal, zone, ...scatter(animal.id, zone, i, list.length) }));
    }
    return { pins, elsewhere, counts: byZone };
  }, [animals, layout]);

  if (animals.length === 0) return null;

  return (
    <section className="px-4 mb-6">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between mb-2"
          aria-expanded={open}
        >
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MapIcon size={20} />
            Around campus
          </h2>
          {open ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </button>

        {open && hasGeo && (
          <div className="flex gap-1.5 mb-2" role="group" aria-label="Map style">
            {(['sketch', 'geo'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`text-xs font-bold rounded-full px-3 py-1.5 border transition ${
                  view === v ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground border-border'
                }`}
              >
                {v === 'sketch' ? '✏️ Sketch' : '🗺️ Real map'}
              </button>
            ))}
          </div>
        )}

        {open && view === 'geo' && <GeoCampusMap animals={animals} onOpenProfile={onOpenProfile} />}

        {open && view === 'sketch' && (
          <div className="on-tint bg-[#FFF8EE] rounded-3xl border-2 border-amber-200 shadow-sm overflow-hidden">
            <svg
              viewBox="0 0 1000 745"
              className="w-full h-auto block"
              role="img"
              aria-label={`Schematic map of ${layout.caption}`}
              style={{ fontFamily: 'inherit' }}
            >
              <defs>
                {/* A tiny wobble on every zone edge, so nothing reads as a CAD drawing. */}
                <filter id="wobble" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <pattern id="paper" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="0.5" fill="#C9A77E" opacity="0.25" />
                </pattern>
              </defs>

              <rect width="1000" height="745" fill="url(#paper)" />

              {layout.lake && (
                <g filter="url(#wobble)">
                  <path d={layout.lake.path} fill="#BFE3F5" stroke="#7CC0E8" strokeWidth="3" />
                  <text x="860" y="420" textAnchor="middle" fontSize="22" fontStyle="italic" fill="#3B7FA8">Powai Lake</text>
                  {/* little waves */}
                  <path d="M 800 300 q 10 -8 20 0 q 10 8 20 0" fill="none" stroke="#7CC0E8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 860 500 q 10 -8 20 0 q 10 8 20 0" fill="none" stroke="#7CC0E8" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {layout.roads?.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#D9BFA6" strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />
              ))}

              {layout.zones.map((z) => {
                const n = placed.counts.get(z.id)?.length ?? 0;
                return (
                  <g key={z.id} filter="url(#wobble)">
                    <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill={z.tint} stroke="#9C8264" strokeWidth="2.5" strokeLinejoin="round" />
                    <text
                      x={z.cx}
                      y={n > 0 ? z.cy - z.ry - 8 : z.cy + 5}
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="700"
                      fill="#2C2416"
                    >
                      {z.label}
                    </text>
                  </g>
                );
              })}

              {placed.pins.map(({ animal, x, y }) => {
                const presence = getPresence(animal);
                const faded = presence.state === 'unseen';
                return (
                  <g
                    key={animal.id}
                    transform={`translate(${x - 18}, ${y - 18})`}
                    onClick={() => onOpenProfile(animal)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenProfile(animal); }}
                    aria-label={`${animal.name}, ${animal.location}`}
                  >
                    <title>{animal.name} · {animal.location}{faded ? ' · not seen in a while' : ''}</title>
                    <circle cx="18" cy="18" r="20" fill="#FFFFFF" stroke="#9C8264" strokeWidth="2" opacity={faded ? 0.55 : 1} />
                    <clipPath id={`clip-${animal.id}`}><circle cx="18" cy="18" r="17" /></clipPath>
                    <image
                      href={getAnimalAvatar(animal, 80)}
                      x="1" y="1" width="34" height="34"
                      clipPath={`url(#clip-${animal.id})`}
                      preserveAspectRatio="xMidYMid slice"
                      opacity={faded ? 0.55 : 1}
                    />
                    <text x="18" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2C2416" style={{ paintOrder: 'stroke', stroke: '#FFF8EE', strokeWidth: 3 }}>
                      {animal.name}
                    </text>
                  </g>
                );
              })}

              <text x="12" y="735" fontSize="11" fill="#6B5A4E">{layout.caption}</text>
            </svg>

            {placed.elsewhere.length > 0 && (
              <p className="text-xs text-muted-foreground px-4 py-2 border-t border-amber-200">
                Somewhere on campus, area not matched:{' '}
                {placed.elsewhere.map((a) => (
                  <button key={a.id} type="button" onClick={() => onOpenProfile(a)} className="font-bold underline underline-offset-2 mr-2">
                    {a.name}
                  </button>
                ))}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
