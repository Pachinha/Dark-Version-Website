import LegalPage from "@/components/LegalPage";
import { COMPANY } from "@/lib/legal";

export const metadata = { title: "Termos de Utilização — Lareiras Pachinha" };

// RASCUNHO — rever com um jurista antes de publicar.
export default function TermosPage() {
  return (
    <LegalPage title="Termos de Utilização">
      <h2>1. Identificação</h2>
      <p>
        Este site é explorado pela {COMPANY.name}, NIF {COMPANY.nif}, {COMPANY.address}.
      </p>

      <h2>2. Área de cliente</h2>
      <p>
        A conta é pessoal. É responsável por manter a palavra-passe confidencial e por indicar dados verdadeiros,
        em particular a morada onde pretende receber serviços. Pode apagar a conta a qualquer momento.
      </p>

      <h2>3. Orçamentos e agendamentos</h2>
      <p>
        Os pedidos de orçamento feitos no site não são vinculativos para nenhuma das partes. As datas de
        manutenção indicadas pelo cliente são preferências: o agendamento só fica confirmado quando o estado do
        pedido passar a “Agendado”. Preços, condições e garantias constam do orçamento ou da fatura.
      </p>

      <h2>4. Informação sobre produtos</h2>
      <p>
        Fazemos o possível para que as descrições e imagens sejam exatas, mas podem existir diferenças em relação
        ao produto. A disponibilidade de artigos do outlet é limitada ao stock existente.
      </p>

      <h2>5. Resolução de litígios</h2>
      <p>
        Em caso de litígio, o consumidor pode recorrer ao{" "}
        <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">Livro de Reclamações Eletrónico</a>{" "}
        ou a uma entidade de resolução alternativa de litígios de consumo: [Centro de Arbitragem competente,
        ex.: CIAB — Centro de Informação, Mediação e Arbitragem de Consumo (Tribunal Arbitral de Consumo), www.ciab.pt].
      </p>

      <h2>6. Lei aplicável</h2>
      <p>Estes termos regem-se pela lei portuguesa.</p>
    </LegalPage>
  );
}
