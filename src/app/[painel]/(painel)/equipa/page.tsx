import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setUserRole } from "@/app/actions/admin";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import { ROLE_LABEL } from "@/lib/labels";

type Person = { id: string; full_name: string; email: string; role: string };

function RoleForm({ person }: { person: Person }) {
  return (
    <ConfirmedForm action={setUserRole} labels={{ role: `Papel de ${person.full_name || person.email}` }} submitLabel="Alterar papel">
      <input type="hidden" name="id" value={person.id} />
      <label className="field" style={{ maxWidth: 240 }}>
        Papel
        <select name="role" defaultValue={person.role}>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
    </ConfirmedForm>
  );
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { user } = await requireAdmin();
  const { email } = await searchParams;
  const supabase = await createClient();

  const [{ data: staff }, { data: found }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["admin", "tecnico"]).order("role").order("full_name"),
    email
      ? supabase.from("profiles").select("id, full_name, email, role").eq("email", email.trim().toLowerCase()).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Equipa</h2>
        <ul className="list">
          {staff?.map((p) => (
            <li key={p.id} className="item">
              <div className="item-head">
                <strong>{p.full_name || "(sem nome)"}</strong>
                <span className="badge">{ROLE_LABEL[p.role]}</span>
              </div>
              <div className="muted">{p.email}</div>
              {p.id === user.id ? (
                <p className="hint" style={{ margin: "8px 0 0" }}>É a sua conta — não pode alterar o seu próprio papel.</p>
              ) : (
                <RoleForm person={p} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Adicionar técnico ou administrador</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          1. A pessoa cria conta no site em <strong>/registar</strong>.<br />
          2. Pesquise aqui o email dela e mude o papel para Técnico.<br />
          O técnico vê apenas as limpezas e obras que lhe forem atribuídas.
        </p>
        <form className="row" style={{ marginBottom: 16 }}>
          <label className="field" style={{ flex: 1, minWidth: 200 }}>
            Email
            <input name="email" type="email" defaultValue={email} required />
          </label>
          <button className="btn btn-ink btn-sm" style={{ alignSelf: "flex-end", marginBottom: 4 }}>Procurar</button>
        </form>
        {email && !found && <p className="alert alert-error">Não existe nenhuma conta com esse email.</p>}
        {found && (
          <div className="item">
            <div className="item-head">
              <strong>{found.full_name || "(sem nome)"}</strong>
              <span className="badge">{ROLE_LABEL[found.role]}</span>
            </div>
            <div className="muted">{found.email}</div>
            {found.id !== user.id && <RoleForm person={found} />}
          </div>
        )}
      </section>
    </div>
  );
}
