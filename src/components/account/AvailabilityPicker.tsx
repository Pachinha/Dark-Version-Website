"use client";

import { AVAILABILITY_SLOTS, PERIODS, WEEKDAYS } from "@/lib/labels";

// Grelha dia × período. Tocar no nome do dia ou do período marca a linha/coluna toda.
export default function AvailabilityPicker({ value, onChange }: { value: string[]; onChange: (slots: string[]) => void }) {
  function toggle(slot: string) {
    onChange(value.includes(slot) ? value.filter((s) => s !== slot) : [...value, slot]);
  }

  function selectMany(slots: string[]) {
    const allOn = slots.every((s) => value.includes(s));
    onChange(allOn ? value.filter((s) => !slots.includes(s)) : [...new Set([...value, ...slots])]);
  }

  return (
    <div className="field">
      Dias e períodos preferidos
      <span className="hint">Toque para marcar. Se não marcar nada, consideramos qualquer dia útil.</span>
      <div className="slot-grid" role="group" aria-label="Disponibilidade semanal">
        <span />
        {Object.entries(PERIODS).map(([p, info]) => (
          <button type="button" key={p} className="slot-head" onClick={() => selectMany(Object.keys(WEEKDAYS).map((d) => `${d}-${p}`))}>
            {info.label}
            <small>{info.hours}</small>
          </button>
        ))}
        {Object.entries(WEEKDAYS).map(([d, day]) => (
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
                  aria-label={`${day}, ${info.label.toLowerCase()}`}
                  onClick={() => toggle(slot)}
                >
                  {on ? "✓" : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 4 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...AVAILABILITY_SLOTS])}>Qualquer altura</button>
        {value.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([])}>Limpar</button>
        )}
      </div>
    </div>
  );
}
