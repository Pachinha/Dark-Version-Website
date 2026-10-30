import { PERIODS, WEEKDAYS } from "@/lib/labels";

// Disponibilidade indicada pelo cliente, em grelha dia × período.
export default function AvailabilityTable({ slots }: { slots: string[] | null | undefined }) {
  if (!slots?.length) return <>Qualquer dia útil</>;
  return (
    <table className="avail">
      <thead>
        <tr><th />{Object.values(PERIODS).map((p) => <th key={p.label}>{p.label}<small>{p.hours}</small></th>)}</tr>
      </thead>
      <tbody>
        {Object.entries(WEEKDAYS).map(([d, day]) => (
          <tr key={d}>
            <th>{day}</th>
            {Object.keys(PERIODS).map((p) => {
              const on = slots.includes(`${d}-${p}`);
              return <td key={p} className={on ? "avail-on" : ""} aria-label={on ? "Disponível" : "Não indicado"}>{on ? "✓" : ""}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
