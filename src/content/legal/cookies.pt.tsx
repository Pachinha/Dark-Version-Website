import CookieSettingsButton from "@/components/CookieSettingsButton";

export default function Pt() {
  return (
    <>
      <p>
        Cookies são pequenos ficheiros guardados no seu navegador. Usamos apenas os cookies necessários e, se
        autorizar, cookies de estatística. Não usamos cookies de publicidade.
      </p>

      <h2>Cookies essenciais (sempre ativos)</h2>
      <p>Necessários para o site funcionar. Não exigem consentimento.</p>
      <table>
        <thead>
          <tr><th>Nome</th><th>Finalidade</th><th>Duração</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-…-auth-token</code></td><td>Manter a sessão iniciada na área de cliente (Supabase)</td><td>Até terminar sessão</td></tr>
          <tr><td><code>pachinha_consent</code></td><td>Lembrar a sua escolha sobre cookies</td><td>6 meses</td></tr>
            <tr><td><code>pachinha_lang</code></td><td>Lembrar a língua que escolheu</td><td>1 ano</td></tr>
        </tbody>
      </table>

      <h2>Cookies de estatística (só com autorização)</h2>
      <p>
        Ajudam-nos a perceber como o site é utilizado (páginas mais vistas, tempo de visita). Só são instalados
        se clicar em “Aceitar”.
      </p>
      <table>
        <thead>
          <tr><th>Nome</th><th>Fornecedor</th><th>Finalidade</th><th>Duração</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Distinguir visitantes</td><td>2 anos</td></tr>
          <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google Analytics</td><td>Manter o estado da visita</td><td>2 anos</td></tr>
        </tbody>
      </table>

      <h2>Alterar a sua escolha</h2>
      <p>
        Pode aceitar ou recusar a qualquer momento:{" "}
        <CookieSettingsButton style={{ color: "#bf5b2d", fontWeight: 600, textDecoration: "underline" }} />.
        Também pode apagar os cookies nas definições do seu navegador.
      </p>
    </>
  );
}
