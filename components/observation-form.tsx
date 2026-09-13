'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';
import {
  AGE_OPTIONS,
  BODY_OPTIONS,
  HEALTH_FLAGS,
  SEX_OPTIONS,
  summariseObservation,
  type Observation,
} from '@/lib/survey';
import { formatTimeSince } from '@/lib/care-tracking';

interface ObservationFormProps {
  animalId: number;
  current?: Observation;
}

/**
 * The survey card: what a field surveyor records on a sighting, laid out so it
 * can be filled in with a thumb while standing next to the animal. Every field
 * is optional; saving with nothing changed still counts as a sighting.
 */
export default function ObservationForm({ animalId, current }: ObservationFormProps) {
  const [draft, setDraft] = useState<Observation>({ ...(current ?? {}) });
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Observation>(key: K, value: Observation[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    useAnimalStore.getState().recordObservation(animalId, draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const Choice = <T extends string>({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: T | undefined;
    options: Array<{ value: T; label: string; hint?: string }>;
    onChange: (v: T) => void;
  }) => (
    <fieldset>
      <legend className="text-xs font-bold text-foreground mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={(value ?? 'unknown') === o.value}
            title={o.hint || undefined}
            className={`text-xs rounded-full px-3 py-1.5 border transition ${
              (value ?? 'unknown') === o.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-white dark:bg-card text-foreground border-border hover:border-foreground/50'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-4 bg-white/70 dark:bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <ClipboardCheck size={15} />
            What did you notice?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Same fields the campus survey teams record. Skip anything you&apos;re not sure of.
          </p>
        </div>
        {current?.observed_at && (
          <p className="text-[10px] text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
            updated {formatTimeSince(new Date(current.observed_at))}
          </p>
        )}
      </div>

      <Choice label="Sex" value={draft.sex} options={SEX_OPTIONS} onChange={(v) => set('sex', v)} />

      {draft.sex === 'female' && (
        <label className="flex items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={Boolean(draft.lactating)}
            onChange={(e) => set('lactating', e.target.checked)}
            className="accent-foreground"
          />
          Appears to be nursing puppies
        </label>
      )}

      <Choice label="Age" value={draft.age_class} options={AGE_OPTIONS} onChange={(v) => set('age_class', v)} />

      <Choice
        label="Body condition"
        value={draft.body_condition}
        options={BODY_OPTIONS}
        onChange={(v) => set('body_condition', v)}
      />

      <fieldset>
        <legend className="text-xs font-bold text-foreground mb-1.5">Tick anything you saw</legend>
        <div className="space-y-1.5">
          {HEALTH_FLAGS.map((flag) => (
            <label key={flag.key} className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={Boolean(draft[flag.key])}
                onChange={(e) => set(flag.key, e.target.checked as any)}
                className="accent-foreground"
              />
              {flag.label}
              {flag.urgent && draft[flag.key] && (
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400">
                  — consider filing an emergency report too
                </span>
              )}
            </label>
          ))}
        </div>
        {/* Plain statement, because the field convention invites the wrong inference. */}
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          An ear notch usually means the animal has been through a sterilisation programme,
          but it is not proof — notched dogs have later been found pregnant. It is recorded
          here only as something seen.
        </p>
      </fieldset>

      {summariseObservation(draft) && (
        <p className="text-xs text-muted-foreground italic">Summary: {summariseObservation(draft)}</p>
      )}

      <button
        type="button"
        onClick={save}
        className="w-full bg-foreground text-background font-bold py-2.5 rounded-xl active:scale-95 transition text-sm"
      >
        {saved ? 'Saved — thank you 🐾' : 'Save observation'}
      </button>
    </div>
  );
}
