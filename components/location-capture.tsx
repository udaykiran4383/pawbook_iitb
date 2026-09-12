'use client';

import { useState } from 'react';
import { MapPin, Loader, Check, X } from 'lucide-react';
import { quantizeCoords, type Coords } from '@/lib/duplicate-detection';

interface LocationCaptureProps {
  value: Coords | null;
  onChange: (coords: Coords | null) => void;
}

type Status = 'idle' | 'locating' | 'captured' | 'denied' | 'unavailable' | 'inaccurate';

/** IIT Bombay's Powai campus, generously bounded. */
const CAMPUS = { minLat: 19.115, maxLat: 19.145, minLng: 72.900, maxLng: 72.930 };

function onCampus(coords: Coords): boolean {
  return (
    coords.lat >= CAMPUS.minLat &&
    coords.lat <= CAMPUS.maxLat &&
    coords.lng >= CAMPUS.minLng &&
    coords.lng <= CAMPUS.maxLng
  );
}

/**
 * Optional, deliberately coarse location capture for a new animal.
 *
 * The reading is rounded to a ~100 m grid before it is held in state or sent
 * anywhere, so a precise position is never stored at all. It exists to catch
 * duplicate entries — two students adding the same dog under different names,
 * which is the usual way a duplicate happens — and that question only needs
 * home-range resolution. The public page shows only the area name someone typed
 * ("H11", "EE Department"), never a point on a map.
 *
 * That split is deliberate. A precise, public, per-animal location log is a
 * targeting list for anyone who wants to harm these animals, and Indian courts
 * are currently pushing identity-grade stray records toward state-held systems
 * rather than public maps. Skipping is always allowed and costs nothing but a
 * weaker duplicate check.
 */
export default function LocationCapture({ value, onChange }: LocationCaptureProps) {
  const [status, setStatus] = useState<Status>(value ? 'captured' : 'idle');

  const capture = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Coarsened immediately, before it is held in state or sent anywhere.
        // The precise reading is never stored, so it cannot leak later.
        const coords = quantizeCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        // A fix from across the city is worse than none: it would make a distant
        // animal look like a duplicate of whatever is nearest to the bad point.
        if (!onCampus(coords)) {
          setStatus('inaccurate');
          onChange(null);
          return;
        }

        onChange(coords);
        setStatus('captured');
      },
      () => {
        setStatus('denied');
        onChange(null);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const clear = () => {
    onChange(null);
    setStatus('idle');
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      {status === 'captured' && value ? (
        <div className="flex items-start gap-2">
          <Check size={16} className="text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Location noted</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Saved as a rough 100 m area, never an exact spot, and not shown anywhere
              on the site.
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground transition flex-shrink-0"
            aria-label="Remove captured location"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={capture}
            disabled={status === 'locating'}
            className="flex items-center gap-2 text-sm font-bold text-foreground disabled:opacity-60"
          >
            {status === 'locating' ? <Loader size={16} className="animate-spin" /> : <MapPin size={16} />}
            {status === 'locating' ? 'Finding you…' : 'Use my current location'}
            <span className="font-normal text-xs text-muted-foreground">(optional)</span>
          </button>

          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Helps us spot if this animal is already on PawBook under another name.
            Rounded to a rough 100 m area before it is saved — your exact position
            never leaves your phone.
          </p>

          {status === 'denied' && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
              No location permission — that&apos;s fine, carry on without it.
            </p>
          )}
          {status === 'unavailable' && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
              This browser can&apos;t share a location. Carry on without it.
            </p>
          )}
          {status === 'inaccurate' && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
              That reading puts you off campus, so it wasn&apos;t saved. Try again outdoors, or
              carry on without it.
            </p>
          )}
        </>
      )}
    </div>
  );
}
