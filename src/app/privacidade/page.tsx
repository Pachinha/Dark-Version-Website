import LegalPage from "@/components/LegalPage";
import { COMPANY } from "@/lib/legal";

export const metadata = { title: "Política de Privacidade — Lareiras Pachinha" };

// RASCUNHO — rever com um jurista antes de publicar. Os campos entre [ ] têm de ser preenchidos.
export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade">
      <p>
        A {COMPANY.name} respeita a sua privacidade e trata os seus dados pessoais de acordo com o
        Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento (UE) 2016/679) e a Lei n.º 58/2019.
      </p>

      <h2>1. Quem é o responsável pelos seus dados</h2>
      <p>
        {COMPANY.name}, NIF {COMPANY.nif}, com sede em {COMPANY.address}.<br />
        Contacto para questões de privacidade: {COMPANY.email} · {COMPANY.phone}
      </p>

      <h2>2. Que dados recolhemos</h2>
      <ul>
        <li><strong>Dados de conta:</strong> nome, email, telefone (opcional) e palavra-passe (guardada cifrada — nunca temos acesso a ela).</li>
        <li><strong>Moradas:</strong> a morada onde pretende receber serviços e as respetivas coordenadas, para que o técnico consiga chegar ao local.</li>
        <li><strong>Localização (opcional):</strong> se escolher “Usar a minha localização atual”, o seu navegador partilha a posição GPS <em>uma única vez</em>, apenas para guardar essa morada. Nunca acompanhamos a sua localização.</li>
        <li><strong>Pedidos e encomendas:</strong> pedidos de orçamento, pedidos de manutenção/limpeza, equipamentos e histórico de encomendas.</li>
        <li><strong>Registo de consentimentos:</strong> data e versão desta política que aceitou e as suas preferências de marketing.</li>
        <li><strong>Dados de navegação:</strong> só com a sua autorização, estatísticas de utilização do site através do Google Analytics (ver a <a href="/cookies">Política de Cookies</a>).</li>
      </ul>

      <h2>3. Para que usamos os dados e com que fundamento</h2>
      <table>
        <thead>
          <tr><th>Finalidade</th><th>Fundamento legal (art. 6.º RGPD)</th></tr>
        </thead>
        <tbody>
          <tr><td>Criar e gerir a sua conta, responder a orçamentos, agendar e realizar manutenções</td><td>Execução de contrato e diligências pré-contratuais a seu pedido</td></tr>
          <tr><td>Faturação e obrigações fiscais</td><td>Cumprimento de obrigação legal</td></tr>
          <tr><td>Envio de novidades e promoções por email</td><td>Consentimento (opcional, pode retirá-lo a qualquer momento)</td></tr>
          <tr><td>Estatísticas de utilização do site (Google Analytics)</td><td>Consentimento, dado no aviso de cookies</td></tr>
          <tr><td>Segurança do site e prevenção de fraude</td><td>Interesse legítimo</td></tr>
        </tbody>
      </table>

      <h2>4. Com quem partilhamos os dados</h2>
      <p>Não vendemos os seus dados. Recorremos apenas a prestadores de serviços (subcontratantes) que tratam os dados por nossa conta:</p>
      <ul>
        <li><strong>Supabase</strong> — alojamento da base de dados e autenticação, em servidores na União Europeia.</li>
        <li><strong>[Fornecedor de alojamento do site, ex.: Vercel]</strong> — alojamento do site.</li>
        <li><strong>Komoot (Photon)</strong> — pesquisa de moradas a partir de dados do OpenStreetMap; recebe apenas o texto que escreve na pesquisa ou as coordenadas a converter em morada.</li>
        <li><strong>Google Ireland Ltd.</strong> — Google Analytics, apenas se aceitar. Pode implicar transferência para os EUA ao abrigo do Quadro de Privacidade de Dados UE-EUA.</li>
      </ul>
      <p>Os técnicos da Pachinha acedem à sua morada apenas para realizar os serviços que pediu.</p>

      <h2>5. Durante quanto tempo guardamos os dados</h2>
      <ul>
        <li>Dados de conta, moradas e pedidos: enquanto a conta estiver ativa, ou até [3] anos após a última utilização.</li>
        <li>Documentos de faturação: 10 anos, conforme a lei fiscal portuguesa.</li>
        <li>Consentimento de marketing: até o retirar.</li>
      </ul>

      <h2>6. Os seus direitos</h2>
      <p>Tem direito a:</p>
      <ul>
        <li><strong>Aceder</strong> aos seus dados e <strong>levá-los consigo</strong> (portabilidade) — em “A minha conta → Dados & privacidade → Descarregar dados”;</li>
        <li><strong>Corrigir</strong> os seus dados — na área de cliente;</li>
        <li><strong>Apagar</strong> a sua conta — em “Dados & privacidade → Apagar conta”;</li>
        <li><strong>Retirar o consentimento</strong> de marketing ou cookies a qualquer momento, sem afetar o tratamento já feito;</li>
        <li><strong>Opor-se</strong> ao tratamento ou pedir a sua <strong>limitação</strong>.</li>
      </ul>
      <p>
        Para exercer qualquer direito, use a área de cliente ou escreva para {COMPANY.email}. Respondemos no prazo
        máximo de um mês. Tem também o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados
        (CNPD) — <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">www.cnpd.pt</a>.
      </p>

      <h2>7. Segurança</h2>
      <p>
        As ligações ao site são cifradas (HTTPS), as palavras-passe são guardadas com hash e cada cliente só
        consegue aceder aos seus próprios dados. O acesso administrativo está limitado a pessoal autorizado.
      </p>

      <h2>8. Alterações a esta política</h2>
      <p>
        Se alterarmos esta política de forma significativa, avisaremos na área de cliente e, quando necessário,
        pediremos novamente o seu consentimento.
      </p>
    </LegalPage>
  );
}
