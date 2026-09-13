'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Animal } from '@/lib/demo-data';
import { getMapLayout, zoneFor, type MapZone } from '@/lib/campus-map';
import { getAnimalAvatar } from '@/lib/animal-avatar';
import { getPresence } from '@/lib/presence';
import { temperamentColour } from '@/lib/survey';
import { useCampus } from '@/components/campus-provider';

interface GeoCampusMapProps {
  animals: Animal[];
  onOpenProfile: (animal: Animal) => void;
}

/**
 * The geographic view: real roads, buildings and the lake from OpenStreetMap,
 * served by OpenFreeMap (no key, no quota, free for any use). On top of it,
 * translucent zone circles and the animals scattered inside them.
 *
 * The scatter is the point. Each animal is placed at a stable pseudo-random
 * offset inside its zone's circle — a few dozen metres from a centre that is
 * itself approximate — so the map shows "she lives around H11", which the
 * animal's page already says, and never "she sleeps behind this door". The
 * stored coordinates (already coarsened to ~100 m) are not used here at all.
 *
 * MapLibre touches `window` at import, so it is loaded lazily inside the
 * effect and this component is only ever mounted on the client.
 */

/** Deterministic offset inside a circle, in metres, from an id. */
function offsetFor(id: number, index: number, radius: number): { dLat: number; dLng: number } {
  const angle = index * 2.399963 + (id % 11) * 0.57;
  const r = radius * 0.7 * Math.sqrt(((id * 7 + index * 13) % 97) / 97);
  const dNorth = Math.sin(angle) * r;
  const dEast = Math.cos(angle) * r;
  return { dLat: dNorth / 111_320, dLng: dEast / (111_320 * Math.cos((19.13 * Math.PI) / 180)) };
}

function circlePolygon(lat: number, lng: number, radius: number, steps = 40): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const dLat = (Math.sin(a) * radius) / 111_320;
    const dLng = (Math.cos(a) * radius) / (111_320 * Math.cos((lat * Math.PI) / 180));
    ring.push([lng + dLng, lat + dLat]);
  }
  return ring;
}

export default function GeoCampusMap({ animals, onOpenProfile }: GeoCampusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [unsupported, setUnsupported] = useState(false);
  // Flipped once the style has loaded, so the marker effect re-runs then.
  const [ready, setReady] = useState(false);
  const libRef = useRef<any>(null);
  // Stable reference: a fresh object each render would re-run the marker
  // effect every render and cancel its own work before it finished.
  const { campus } = useCampus();
  const layout = useMemo(() => getMapLayout(campus), [campus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await import('maplibre-gl');
      libRef.current = maplibregl;
      // MapLibre 6 fetches and parses vector tiles in a web worker that it
      // locates relative to import.meta.url. Under the bundler that URL does
      // not point at a real file, the worker is never created, and the map
      // silently never loads a single tile. The worker, its shared chunk and
      // the stylesheet are vendored into /public (same pinned version as the
      // package) and served from this origin — no third-party CDN to be
      // blocked by a campus network.
      maplibregl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs');
      if (!document.getElementById('maplibre-css')) {
        const link = document.createElement('link');
        link.id = 'maplibre-css';
        link.rel = 'stylesheet';
        link.href = '/vendor/maplibre/maplibre-gl.css';
        document.head.appendChild(link);
      }
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center = layout.center ?? { lat: 19.1325, lng: 72.9125, zoom: 15 };
      let map: any;
      try {
        map = new maplibregl.Map({
          container: containerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [center.lng, center.lat],
          zoom: center.zoom,
          attributionControl: { compact: true },
        });
      } catch {
        // Old phones and some webviews have no WebGL2. The sketch still works.
        setUnsupported(true);
        return;
      }
      map.on('error', (e: any) => {
        if (/WebGL/i.test(String(e?.error?.message ?? ''))) setUnsupported(true);
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;

      map.once('style.load', () => {
        const zones = layout.zones.filter((z): z is MapZone & { geo: NonNullable<MapZone['geo']> } => Boolean(z.geo));
        map.addSource('zones', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: zones.map((z) => ({
              type: 'Feature',
              properties: { label: z.label, tint: z.tint },
              geometry: { type: 'Polygon', coordinates: [circlePolygon(z.geo.lat, z.geo.lng, z.geo.radius)] },
            })),
          },
        });
        map.addLayer({ id: 'zones-fill', type: 'fill', source: 'zones', paint: { 'fill-color': ['get', 'tint'], 'fill-opacity': 0.45 } });
        map.addLayer({ id: 'zones-line', type: 'line', source: 'zones', paint: { 'line-color': '#9C8264', 'line-width': 2, 'line-dasharray': [3, 2] } });
        map.addLayer({
          id: 'zones-label',
          type: 'symbol',
          source: 'zones',
          // Must be a font the tile server actually hosts, or every label 404s.
          layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-offset': [0, -2.2] },
          paint: { 'text-color': '#2C2416', 'text-halo-color': '#FFF8EE', 'text-halo-width': 1.5 },
        });
        setReady(true);
        containerRef.current?.setAttribute('data-ready', '1');
      });
    })();
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The layout is per-campus and fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers follow the animal list. Synchronous: the library is already loaded
  // by the time `ready` flips, so there is nothing to await and nothing to race.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = libRef.current;
    if (!map || !maplibregl || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const perZone = new Map<string, number>();
    for (const a of animals) {
      if (a.status === 'deceased' || a.status === 'adopted') continue;
      const z = zoneFor(a.location, layout);
      if (!z?.geo) continue;
      const i = perZone.get(z.id) ?? 0;
      perZone.set(z.id, i + 1);
      const { dLat, dLng } = offsetFor(a.id, i, z.geo.radius);
      const faded = getPresence(a).state === 'unseen';
      // Same ring colours as the sketch, so the two views agree.
      const temperament = a.observation?.temperament;
      const ring = temperamentColour(temperament);
      const unknown = !temperament || temperament === 'unknown';

      const el = document.createElement('button');
      el.type = 'button';
      el.title = `${a.name} · ${a.location} · ${ring.label}`;
      el.setAttribute('aria-label', `${a.name}, around ${z.label}, ${ring.label}`);
      el.style.cssText = `position:relative;width:40px;height:40px;border-radius:50%;border:3px solid ${ring.stroke};background:${ring.fill} url("${getAnimalAvatar(a, 80)}") center/cover;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;opacity:${faded ? 0.55 : 1};padding:0`;
      if (unknown) {
        const badge = document.createElement('span');
        badge.textContent = '?';
        badge.setAttribute('aria-hidden', 'true');
        badge.style.cssText = `position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:#FFF8EE;border:1.5px solid ${ring.stroke};color:${ring.stroke};font:700 10px/13px system-ui,sans-serif;text-align:center`;
        el.appendChild(badge);
      }
      el.addEventListener('click', () => onOpenProfile(a));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([z.geo.lng + dLng, z.geo.lat + dLat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [animals, layout, onOpenProfile, ready]);

  if (unsupported) {
    return (
      <div className="rounded-3xl border-2 border-amber-200 dark:border-border p-6 text-center bg-card">
        <p className="text-sm font-bold text-foreground">This device can&apos;t draw the street map.</p>
        <p className="text-xs text-muted-foreground mt-1">It needs WebGL2, which older phones lack. The sketch view shows the same areas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-amber-200 dark:border-border shadow-sm">
      <div ref={containerRef} style={{ height: 520 }} aria-label="Map of campus areas" />
      <p className="text-[11px] text-muted-foreground px-4 py-2 bg-card border-t border-border">
        Map data © OpenStreetMap contributors, tiles by OpenFreeMap. Animals are placed inside their
        area at random — this shows where they are known, not where they sleep.
      </p>
    </div>
  );
}
