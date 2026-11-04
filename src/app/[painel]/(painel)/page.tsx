import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePanel, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE_SERVICE, QUOTE_STATUS, TZ, formatDate, formatTime, lisbonDay, one, quoteRef } from "@/lib/labels";
import { googleMapsSearchUrl, googleMapsUrl, wazeSearchUrl, wazeUrl } from "@/lib/geo";
import { panel } from "@/lib/panel";
import Attention from "@/components/admin/Attention";

type Item = {
  id: string;
  kind: "obra" | string;
  title: string;
  when: string;
  client: string;
  phone: string;
  address: { address: string; details: string; lat?: number; lng?: number } | null;
  href: string;
};

type QuoteStat = { created_at: string; category: string; municipality: string | null; status: string };
type RecentQuote = { id: string; ref: number; category: string; name: string; municipality: string | null; status: string; created_at: string; profiles: unknown };

const DAY = 86_400_000;

// "há 3 h", "há 2 dias"
function since(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

function greeting(now: Date) {
  const hour = Number(now.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: TZ }));
  return hour < 12 ? "Bom dia" : hour < 20 ? "Boa tarde" : "Boa noite";
}

// Contagem por chave, do maior para o menor.
function tally(values: string[], top = 6) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
}

// Página inicial do painel: o que há para fazer hoje, o que está parado e, para a
// administração, como estão a correr os pedidos e o estado do site.
export default async function AdminHome() {
  const { profile: me } = await requirePanel();
  if (me.role === "colaborador") redirect(panel("/partilhados"));
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * DAY);
  const dayStart = new Date(`${lisbonDay(now)}T00:00:00Z`);
  dayStart.setUTCHours(dayStart.getUTCHours() - 2); // margem para o fuso de Lisboa
  const last60 = new Date(now.getTime() - 60 * DAY).toISOString();

  const count = (table: string, column: string, value: string) =>
    supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value);
  const none = Promise.resolve({ data: null, count: 0 });

  const [newQuotes, pendingMaint, unscheduledJobs, maint, jobs, visits, quoteStats, recent, products, brands, categories] = await Promise.all([
    isAdmin ? count("quote_requests", "status", "novo") : none,
    count("maintenance_requests", "status", "pendente"),
    count("jobs", "status", "por_agendar"),
    supabase
      .from("maintenance_requests")
      .select("id, service, scheduled_for, name, phone, address, address_details, lat, lng, profiles!maintenance_requests_user_id_fkey(full_name, phone), addresses(address, details, lat, lng)")
      .eq("status", "agendado")
      .gte("scheduled_for", dayStart.toISOString())
      .lte("scheduled_for", weekEnd.toISOString())
      .order("scheduled_for"),
    supabase
      .from("jobs")
      .select("id, title, scheduled_start, name, phone, address, address_details, lat, lng, profiles!jobs_user_id_fkey(full_name, phone), addresses(address, details, lat, lng), quote:quote_requests(name, phone, address, address_details, lat, lng)")
      .in("status", ["agendado", "em_curso"])
      .gte("scheduled_start", dayStart.toISOString())
      .lte("scheduled_start", weekEnd.toISOString())
      .order("scheduled_start"),
    // Visitas de orçamento: o técnico só recebe as que lhe estão atribuídas (base de dados).
    supabase
      .from("quote_requests")
      .select("id, category, visit_at, name, phone, address, address_details, municipality, lat, lng, profiles!quote_requests_user_id_fkey(full_name, phone)")
      .eq("status", "visita_marcada")
      .gte("visit_at", dayStart.toISOString())
      .lte("visit_at", weekEnd.toISOString())
      .order("visit_at"),
    // Só para a administração: últimos 60 dias de pedidos (estatísticas), últimos pedidos e estado do site.
    isAdmin ? supabase.from("quote_requests").select("created_at, category, municipality, status").gte("created_at", last60).returns<QuoteStat[]>() : none,
    isAdmin
      ? supabase.from("quote_requests").select("id, ref, category, name, municipality, status, created_at, profiles!quote_requests_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(5).returns<RecentQuote[]>()
      : none,
    isAdmin ? supabase.from("catalog_products").select("active, photos").returns<{ active: boolean; photos: string[] }[]>() : none,
    isAdmin ? supabase.from("catalog_brands").select("active, logo_url, in_ticker").returns<{ active: boolean; logo_url: string; in_ticker: boolean }[]>() : none,
    isAdmin ? supabase.from("catalog_categories").select("active, image_url").returns<{ active: boolean; image_url: string }[]>() : none,
  ]);

  const items: Item[] = [
    ...(maint.data ?? []).map((m) => ({
      id: m.id,
      kind: m.service,
      title: MAINTENANCE_SERVICE[m.service],
      when: m.scheduled_for!,
      // Cliente sem conta (registado pela administração): dados no próprio registo.
      client: one(m.profiles)?.full_name || m.name || "",
      phone: one(m.profiles)?.phone || m.phone || "",
      address: one(m.addresses) ?? (m.address ? { address: m.address, details: m.address_details ?? "", lat: m.lat ?? undefined, lng: m.lng ?? undefined } : null),
      href: panel(`/manutencao/${m.id}`),
    })),
    ...(jobs.data ?? []).map((j) => ({
      id: j.id,
      kind: "obra",
      title: `Obra: ${j.title}`,
      when: j.scheduled_start!,
      // Obra sem conta de cliente: contactos e morada do pedido de orçamento.
      client: one(j.profiles)?.full_name || j.name || one(j.quote)?.name || "",
      phone: one(j.profiles)?.phone || j.phone || one(j.quote)?.phone || "",
      address: one(j.addresses)
        ?? (j.address ? { address: j.address, details: j.address_details ?? "", lat: j.lat ?? undefined, lng: j.lng ?? undefined } : null)
        ?? (one(j.quote)?.address
        ? { address: one(j.quote)!.address, details: one(j.quote)!.address_details ?? "", lat: one(j.quote)!.lat, lng: one(j.quote)!.lng }
        : null),
      href: panel(`/obras/${j.id}`),
    })),
    ...(visits.data ?? []).map((v) => ({
      id: v.id,
      kind: "visita",
      title: `Visita para orçamento: ${v.category}`,
      when: v.visit_at!,
      client: one(v.profiles)?.full_name || v.name,
      phone: v.phone || one(v.profiles)?.phone || "",
      address: v.lat != null
        ? { address: v.address, details: v.address_details ?? "", lat: v.lat, lng: v.lng }
        : { address: [v.address, v.municipality].filter(Boolean).join(", "), details: "" },
      href: panel(isAdmin ? `/orcamentos/${v.id}` : `/partilhados/pedido/${v.id}`),
    })),
  ].sort((a, b) => a.when.localeCompare(b.when));

  const today = lisbonDay(now);
  const todayItems = items.filter((i) => lisbonDay(i.when) === today);
  const weekItems = items.filter((i) => lisbonDay(i.when) !== today);
  const waiting = (newQuotes.count ?? 0) + (pendingMaint.count ?? 0) + (unscheduledJobs.count ?? 0);
  const firstName = (profile.full_name || "").split(" ")[0];

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <span className="eyebrow" style={{ color: "#e2a276" }}>
            {now.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })}
          </span>
          <h1 className="page-title" style={{ margin: "4px 0 6px" }}>{greeting(now)}{firstName && `, ${firstName}`}</h1>
          <p className="muted-light" style={{ margin: 0 }}>
            {todayItems.length ? `${todayItems.length} serviço${todayItems.length > 1 ? "s" : ""} hoje` : "Nada agendado para hoje"}
            {" · "}
            {waiting ? `${waiting} à espera de resposta ou agendamento` : "nada à espera"}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {isAdmin && <Link href={panel("/novo")} className="btn btn-fire btn-sm">+ Novo registo</Link>}
          <Link href={panel("/agenda")} className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>Abrir agenda</Link>
        </div>
      </header>

      <div className="stats">
        <Stat value={todayItems.length} label="Serviços hoje" href={panel("/agenda")} />
        <Stat value={weekItems.length} label="Próximos 7 dias" href={panel("/agenda")} />
        {isAdmin && <Stat value={newQuotes.count ?? 0} label="Pedidos por responder" href={panel("/orcamentos?estado=novo")} alert />}
        <Stat value={pendingMaint.count ?? 0} label="Limpezas por agendar" href={panel("/manutencao?estado=pendente")} alert />
        <Stat value={unscheduledJobs.count ?? 0} label="Obras por agendar" href={panel("/obras?estado=por_agendar")} alert />
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <section className="panel">
            <div className="item-head">
              <h2>Hoje</h2>
              <span className="muted">{formatDate(now.toISOString())}</span>
            </div>
            <Agenda items={todayItems} empty="Nada agendado para hoje." />
          </section>
          <section className="panel">
            <div className="item-head">
              <h2>Próximos 7 dias</h2>
              <Link href={panel("/agenda")} className="link">Ver agenda →</Link>
            </div>
            <Agenda items={weekItems} empty="Nada agendado para os próximos dias." showDate />
          </section>
        </div>

        <div className="dash-col">
          <Attention isAdmin={isAdmin} />
          {isAdmin && <RecentQuotes quotes={recent.data ?? []} />}
          {isAdmin && <SiteHealth products={products.data ?? []} brands={brands.data ?? []} categories={categories.data ?? []} />}
        </div>
      </div>

      {isAdmin && <Last30Days stats={quoteStats.data ?? []} now={now} />}
    </div>
  );
}

function Stat({ value, label, href, alert }: { value: number; label: string; href: string; alert?: boolean }) {
  return (
    <Link href={href} className={`stat${alert && value > 0 ? " stat-alert" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </Link>
  );
}

function Agenda({ items, empty, showDate }: { items: Item[]; empty: string; showDate?: boolean }) {
  if (!items.length) return <p className="muted" style={{ marginBottom: 0 }}>{empty}</p>;
  return (
    <ul className="list">
      {items.map((i) => (
        <li key={i.id} className="item">
          <div className="item-head">
            <Link href={i.href} className="link"><strong>{i.title}</strong></Link>
            <span className={`event event-${i.kind}`} style={{ marginTop: 0 }}>
              {showDate && `${formatDate(i.when)} · `}{formatTime(i.when)}
            </span>
          </div>
          <div>{i.client}{i.phone && <> · <a className="link" href={`tel:${i.phone}`}>{i.phone}</a></>}</div>
          {i.address && (
            <>
              <div className="muted">{i.address.address}{i.address.details && ` — ${i.address.details}`}</div>
              <div className="row" style={{ marginTop: 6 }}>
                <a className="link" href={i.address.lat != null && i.address.lng != null ? googleMapsUrl(i.address.lat, i.address.lng) : googleMapsSearchUrl(i.address.address)} target="_blank" rel="noreferrer">Google Maps ↗</a>
                <a className="link" href={i.address.lat != null && i.address.lng != null ? wazeUrl(i.address.lat, i.address.lng) : wazeSearchUrl(i.address.address)} target="_blank" rel="noreferrer">Waze ↗</a>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function RecentQuotes({ quotes }: { quotes: RecentQuote[] }) {
  return (
    <section className="panel">
      <div className="item-head">
        <h2>Últimos pedidos</h2>
        <Link href={panel("/orcamentos")} className="link">Todos →</Link>
      </div>
      {quotes.length ? (
        <ul className="list" style={{ gap: 6 }}>
          {quotes.map((q) => (
            <li key={q.id}>
              <Link href={panel(`/orcamentos/${q.id}`)} className="item dash-quote">
                <div style={{ minWidth: 0 }}>
                  <strong>{(one(q.profiles) as { full_name?: string } | null)?.full_name || q.name}</strong>
                  <div className="muted">{q.category}{q.municipality && ` · ${q.municipality}`} · {quoteRef(q.ref)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className={`badge${q.status === "novo" ? " badge-new" : ""}`}>{QUOTE_STATUS[q.status] ?? q.status}</span>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{since(q.created_at)}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Ainda não há pedidos.</p>
      )}
    </section>
  );
}

function SiteHealth({
  products,
  brands,
  categories,
}: {
  products: { active: boolean; photos: string[] }[];
  brands: { active: boolean; logo_url: string; in_ticker: boolean }[];
  categories: { active: boolean; image_url: string }[];
}) {
  const visible = products.filter((p) => p.active).length;
  const checks = [
    { n: products.filter((p) => p.active && !p.photos.length).length, label: "produto(s) visível(eis) sem fotografia", href: panel("/catalogo?estado=sem_foto") },
    { n: brands.filter((b) => b.active && b.in_ticker && !b.logo_url).length, label: "marca(s) na faixa sem logótipo", href: panel("/catalogo/marcas") },
    { n: categories.filter((c) => c.active && !c.image_url).length, label: "categoria(s) sem imagem", href: panel("/catalogo/categorias") },
    { n: products.length - visible, label: "produto(s) escondido(s)", href: panel("/catalogo?estado=escondidos"), info: true },
  ];
  const todo = checks.filter((c) => c.n > 0);
  return (
    <section className="panel">
      <div className="item-head">
        <h2>Site</h2>
        <a href="/" target="_blank" rel="noreferrer" className="link">Abrir o site ↗</a>
      </div>
      <div className="dash-mini">
        <Link href={panel("/catalogo")}><strong>{visible}</strong> produtos visíveis</Link>
        <Link href={panel("/catalogo/marcas")}><strong>{brands.filter((b) => b.active).length}</strong> marcas</Link>
        <Link href={panel("/catalogo/categorias")}><strong>{categories.filter((c) => c.active).length}</strong> categorias</Link>
      </div>
      {todo.length ? (
        <ul className="dash-checks">
          {todo.map((c) => (
            <li key={c.label} className={c.info ? "dash-check-info" : ""}>
              <Link href={c.href}><strong>{c.n}</strong> {c.label} →</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ margin: "12px 0 0" }}>✓ Tudo o que está no site tem fotografia, logótipo e imagem.</p>
      )}
    </section>
  );
}

function Bars({ rows, total }: { rows: [string, number][]; total: number }) {
  if (!rows.length) return <p className="muted" style={{ margin: 0 }}>Sem dados ainda.</p>;
  const max = Math.max(...rows.map(([, n]) => n));
  return (
    <ul className="dash-bars">
      {rows.map(([label, n]) => (
        <li key={label}>
          <span className="dash-bar-label">{label}</span>
          <span className="dash-bar"><span style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="dash-bar-n">{n}<small> · {Math.round((n / total) * 100)}%</small></span>
        </li>
      ))}
    </ul>
  );
}

function Last30Days({ stats, now }: { stats: QuoteStat[]; now: Date }) {
  const cut = now.getTime() - 30 * DAY;
  const current = stats.filter((s) => new Date(s.created_at).getTime() >= cut);
  const previous = stats.length - current.length;
  const diff = current.length - previous;
  const visited = current.filter((s) => ["visita_feita", "orcamento_enviado", "em_obra"].includes(s.status)).length;
  const quoted = current.filter((s) => ["orcamento_enviado", "em_obra"].includes(s.status)).length;
  const won = current.filter((s) => s.status === "em_obra").length;
  const pct = (n: number) => (current.length ? `${Math.round((n / current.length) * 100)}%` : "—");

  return (
    <section className="panel" style={{ marginTop: 20 }}>
      <div className="item-head">
        <h2>Últimos 30 dias</h2>
        <span className="muted">Pedidos de orçamento recebidos e como avançaram</span>
      </div>
      <div className="dash-30">
        <div>
          <h3 className="dash-h3">Pedidos</h3>
          <div className="dash-big">{current.length}</div>
          <p className="muted" style={{ margin: "4px 0 16px" }}>
            {diff === 0 ? "Igual aos 30 dias anteriores" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)} em relação aos 30 dias anteriores (${previous})`}
          </p>
          <ol className="dash-funnel">
            <li><span>Recebidos</span><strong>{current.length}</strong></li>
            <li><span>Com visita feita</span><strong>{visited}</strong><small>{pct(visited)}</small></li>
            <li><span>Orçamento enviado</span><strong>{quoted}</strong><small>{pct(quoted)}</small></li>
            <li><span>Em obra</span><strong>{won}</strong><small>{pct(won)}</small></li>
          </ol>
        </div>
        <div>
          <h3 className="dash-h3">O que procuram</h3>
          <Bars rows={tally(current.map((s) => s.category))} total={current.length} />
        </div>
        <div>
          <h3 className="dash-h3">De onde vêm</h3>
          <Bars rows={tally(current.map((s) => s.municipality || "Sem concelho"))} total={current.length} />
        </div>
      </div>
    </section>
  );
}
