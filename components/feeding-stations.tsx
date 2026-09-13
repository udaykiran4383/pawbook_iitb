'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Utensils, Plus, Clock, X } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';
import { useCampus } from '@/components/campus-provider';
import {
  formatFeedingTime,
  nextFeedingWindow,
  parseTimes,
  sinceLabel,
  sortStations,
  stationStatus,
  STATUS_LABEL,
  type FeedingStation,
  type StationStatus,
} from '@/lib/feeding-stations';

/**
 * Pastel by status, the way emergency cards are pastel by severity. Every
 * container carries `on-tint` so the text stays dark on these light fills in
 * dark mode.
 */
const STATUS_STYLE: Record<StationStatus, { card: string; chip: string; dot: string }> = {
  stocked: {
    card: 'from-green-100 to-emerald-50 border-green-300',
    chip: 'bg-green-200 text-green-900',
    dot: '🟢',
  },
  needs_food: {
    card: 'from-orange-100 to-amber-50 border-orange-300',
    chip: 'bg-orange-200 text-orange-900',
    dot: '🟠',
  },
  stale: {
    card: 'from-yellow-100 to-yellow-50 border-yellow-300',
    chip: 'bg-yellow-200 text-yellow-900',
    dot: '🟡',
  },
  inactive: {
    card: 'from-gray-100 to-gray-50 border-gray-300',
    chip: 'bg-gray-200 text-gray-700',
    dot: '⚪',
  },
};

/**
 * The campus's designated feeding spots, and whether each has food out.
 *
 * Feeding per animal (the "Fed" button on a card) says who ate; this says
 * where the food is, which is what the institution's rules are written in
 * terms of. The three buttons are the three things a feeder is asked to do:
 * put food out at the fixed spot, clear up afterwards, and tell the others
 * when the bowl is empty.
 */
export default function FeedingStations() {
  const { campus, basePath } = useCampus();
  const stored = useAnimalStore((state) => state.stations);
  const stations = useMemo(() => sortStations(Array.isArray(stored) ? stored : []), [stored]);
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({ name: '', zone: '', times: '', notes: '' });

  // Read once per render rather than per card, so every chip agrees on "now".
  const now = Date.now();
  const visible = showInactive ? stations : stations.filter((s) => s.active);
  const inactiveCount = stations.length - stations.filter((s) => s.active).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.zone.trim()) return;

    const station: FeedingStation = {
      id: `fs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: form.name.trim(),
      zone: form.zone.trim(),
      times: parseTimes(form.times),
      notes: form.notes.trim() || undefined,
      active: true,
      needs_food: false,
      created_at: new Date().toISOString(),
    };

    useAnimalStore.getState().addStation(station);
    setForm({ name: '', zone: '', times: '', notes: '' });
    setShowForm(false);
  };

  return (
    <section className="px-4 mb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2 gap-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Utensils size={20} />
            Feeding spots
          </h2>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5 border border-border bg-card text-foreground hover:border-primary transition active:scale-95 whitespace-nowrap"
          >
            <Plus size={14} />
            Add a feeding spot
          </button>
        </div>

        {/* The institution decides where feeding happens; this list records it. */}
        <p className="text-xs text-muted-foreground mb-3">
          Only the spots {campus.shortName} has designated belong here — fixed spot, fixed time, cleared after.{' '}
          <Link href={`${basePath}/rules`} className="underline underline-offset-2 hover:text-foreground">
            Read the feeding rules
          </Link>
          .
        </p>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="on-tint bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 mb-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground text-sm">New feeding spot</p>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground p-1 rounded-full transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-foreground">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Bowl behind H11"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-normal placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </label>
              <label className="block text-xs font-bold text-foreground">
                Area
                <input
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  list="pawbook-station-zones"
                  placeholder="e.g. H11"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-normal placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
                {/* Suggestions only; free text is still allowed. */}
                <datalist id="pawbook-station-zones">
                  {campus.zones.map((z) => <option key={z} value={z} />)}
                </datalist>
              </label>
              <label className="block text-xs font-bold text-foreground">
                Feeding times
                <input
                  value={form.times}
                  onChange={(e) => setForm({ ...form, times: e.target.value })}
                  placeholder="e.g. 07:00, 19:00"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-normal placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </label>
              <label className="block text-xs font-bold text-foreground">
                Notes
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional — water bowl too, dry food only…"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-normal placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Just the area — no exact location is ever stored.
            </p>
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary text-primary-foreground font-bold px-5 py-2 rounded-xl text-sm active:scale-95 transition"
            >
              Add spot
            </button>
          </form>
        )}

        {visible.length === 0 ? (
          <div className="on-tint bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-200 rounded-2xl p-5 text-center">
            <p className="text-sm text-foreground font-bold">No feeding spots recorded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              If {campus.shortName} has designated spots, add them so everyone feeds at the same place and time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visible.map((station) => (
              <StationCard key={station.id} station={station} now={now} />
            ))}
          </div>
        )}

        {inactiveCount > 0 && (
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {showInactive ? 'Hide' : 'Show'} {inactiveCount} spot{inactiveCount === 1 ? '' : 's'} no longer in use
          </button>
        )}
      </div>
    </section>
  );
}

function StationCard({ station, now }: { station: FeedingStation; now: number }) {
  const status = stationStatus(station, now);
  const style = STATUS_STYLE[status];
  const next = nextFeedingWindow(station, now);
  const stocked = sinceLabel(station.last_stocked_at, now);
  const cleared = sinceLabel(station.last_cleared_at, now);
  const times = (station.times ?? []).map(formatFeedingTime);

  return (
    <div className={`on-tint bg-gradient-to-br ${style.card} border-2 rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="font-bold text-foreground truncate">{station.name}</p>
          <p className="text-xs text-muted-foreground">📍 {station.zone}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${style.chip}`}>
          {style.dot} {STATUS_LABEL[status]}
        </span>
      </div>

      {times.length > 0 && (
        <p className="text-xs text-foreground/80 flex items-center gap-1 mt-2">
          <Clock size={12} />
          {times.join(' · ')}
          {next && station.active && (
            <span className="text-muted-foreground"> · next {formatFeedingTime(next.time)}</span>
          )}
        </p>
      )}

      {station.notes && <p className="text-xs text-muted-foreground mt-1">{station.notes}</p>}

      <p className="text-[11px] text-muted-foreground mt-2">
        {stocked ? (
          <>Stocked {stocked}{station.last_stocked_by ? ` by ${station.last_stocked_by}` : ''}</>
        ) : (
          'No stocking recorded yet'
        )}
        {cleared && <> · cleared {cleared}</>}
      </p>

      {station.active ? (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => useAnimalStore.getState().stockStation(station.id)}
            className="flex-1 bg-white/70 dark:bg-card hover:bg-white text-foreground py-2 rounded-lg font-bold text-xs transition active:scale-95"
          >
            I stocked it
          </button>
          <button
            type="button"
            onClick={() => useAnimalStore.getState().clearStation(station.id)}
            className="flex-1 bg-white/70 dark:bg-card hover:bg-white text-foreground py-2 rounded-lg font-bold text-xs transition active:scale-95"
          >
            Cleared up
          </button>
          {status !== 'needs_food' && (
            <button
              type="button"
              onClick={() => useAnimalStore.getState().flagStationNeedsFood(station.id)}
              className="flex-1 border border-white/60 dark:border-border text-foreground py-2 rounded-lg font-bold text-xs transition active:scale-95 hover:bg-white/40"
            >
              Needs food
            </button>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => useAnimalStore.getState().setStationActive(station.id, !station.active)}
        className="mt-2 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        {station.active ? 'No longer a designated spot' : 'Back in use'}
      </button>
    </div>
  );
}
