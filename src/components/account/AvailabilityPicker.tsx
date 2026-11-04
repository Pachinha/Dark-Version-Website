"use client";

import { AVAILABILITY_SLOTS, PERIODS, WEEKDAYS } from "@/lib/labels";
import { useI18n } from "@/lib/i18n/client";

// Grelha dia × período. Tocar no nome do dia ou do período marca a linha/coluna toda.
export default function AvailabilityPicker({ value, onChange }: { value: string[]; onChange: (slots: string[]) => void }) {
  const { t } = useI18n();
  const period = (p: string) => t.labels.periods[p];
  function toggle(slot: string) {
    onChange(value.includes(slot) ? value.filter((s) => s !== slot) : [...value, slot]);
  }

  function selectMany(slots: string[]) {
    const allOn = slots.every((s) => value.includes(s));
    onChange(allOn ? value.filter((s) => !slots.includes(s)) : [...new Set([...value, ...slots])]);
  }

  return (
    <div className="field">
      {t.availability.title}
      <span className="hint">{t.availability.hint}</span>
      <div className="slot-grid" role="group" aria-label={t.availability.aria}>
        <span />
        {Object.entries(PERIODS).map(([p, info]) => (
          <button type="button" key={p} className="slot-head" onClick={() => selectMany(Object.keys(WEEKDAYS).map((d) => `${d}-${p}`))}>
            {period(p)}
            <small>{info.hours}</small>
          </button>
        ))}
        {Object.keys(WEEKDAYS).map((d) => {
          const day = t.labels.weekdays[d];
          return (
            <div key={d} className="slot-row">
              <button type="button" className="slot-day" onClick={() => selectMany(Object.keys(PERIODS).map((p) => `${d}-${p}`))}>
                {day}
              </button>
              {Object.entries(PERIODS).map(([p, info]) => {
                const slot = `${d}-${p}`;
                const on = value.includes(slot);
                return (
                  <button
                    type="button"
                    key={slot}
                    className={`slot${on ? " slot-on" : ""}`}
                    aria-pressed={on}
                    aria-label={`${day}, ${period(p).toLowerCase()}`}
                    onClick={() => toggle(slot)}
                  >
                    {on ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="row" style={{ marginTop: 4 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...AVAILABILITY_SLOTS])}>{t.availability.anyTime}</button>
        {value.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([])}>{t.availability.clear}</button>
        )}
      </div>
    </div>
  );
}
