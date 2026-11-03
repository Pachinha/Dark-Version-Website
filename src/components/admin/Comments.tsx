import { createClient } from "@/lib/supabase/server";
import { deleteComment } from "@/app/actions/sharing";
import { ROLE_LABEL, formatDate, formatTime, one } from "@/lib/labels";
import CommentForm from "./CommentForm";

type Comment = {
  id: number;
  body: string;
  created_at: string;
  profiles: { full_name: string; role: string } | { full_name: string; role: string }[] | null;
};

// Comentários internos sobre um cliente (ou pedido de orçamento). Nunca são vistos pelo cliente.
export default async function Comments({ clientId, quoteId, isAdmin }: { clientId?: string; quoteId?: string; isAdmin: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from("client_comments")
    .select("id, body, created_at, profiles!client_comments_author_id_fkey(full_name, role)")
    .order("created_at", { ascending: true });
  query = clientId ? query.eq("client_id", clientId) : query.eq("quote_id", quoteId ?? "");
  const { data } = await query.returns<Comment[]>();

  return (
    <section className="panel" id="comentarios">
      <h2>Comentários da equipa</h2>
      <p className="hint" style={{ marginTop: 0 }}>Só a equipa vê estes comentários — o cliente não.</p>
      {data?.length ? (
        <ul className="list">
          {data.map((c) => {
            const author = one(c.profiles) as { full_name: string; role: string } | null;
            return (
              <li key={c.id} className="item">
                <div className="item-head">
                  <strong>{author?.full_name || "Ex-membro da equipa"}</strong>
                  <span className="muted">
                    {author && `${ROLE_LABEL[author.role]?.replace(" (só consulta)", "") ?? ""} · `}
                    {formatDate(c.created_at)} às {formatTime(c.created_at)}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{c.body}</p>
                {isAdmin && (
                  <form action={deleteComment} style={{ marginTop: 6 }}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn btn-ghost btn-sm">Apagar</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Ainda não há comentários.</p>
      )}
      <CommentForm clientId={clientId} quoteId={quoteId} />
    </section>
  );
}
