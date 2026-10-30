import Link from "next/link";

export default function StatusFilters({
  statuses,
  active,
}: {
  statuses: Record<string, string>;
  active?: string;
}) {
  return (
    <nav className="filters" aria-label="Filtrar por estado">
      <Link className={`filter${!active ? " filter-active" : ""}`} href="?">Todos</Link>
      {Object.entries(statuses).map(([value, label]) => (
        <Link key={value} className={`filter${active === value ? " filter-active" : ""}`} href={`?estado=${value}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
