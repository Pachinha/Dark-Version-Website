import { COMPANY } from "@/lib/legal";

// Translation of terms.pt.tsx — keep both in step. The Portuguese version prevails.
export default function En() {
  return (
    <>
      <h2>1. Identification</h2>
      <p>
        This website is operated by {COMPANY.name}, tax no. {COMPANY.nif}, {COMPANY.address}.
      </p>

      <h2>2. Client area</h2>
      <p>
        The account is personal. You are responsible for keeping your password confidential and for providing accurate
        information, in particular the address where you want to receive services. You can delete your account at any time.
      </p>

      <h2>3. Quotes and appointments</h2>
      <p>
        Quote requests made on the website are not binding on either party. Maintenance dates given by the client are
        preferences: an appointment is only confirmed when the status of the request changes to “Agendado” (scheduled).
        Prices, conditions and warranties are set out in the quote or the invoice.
      </p>

      <h2>4. Product information</h2>
      <p>
        We do our best to make descriptions and images accurate, but there may be differences from the actual product.
        Availability of outlet items is limited to the stock on hand.
      </p>

      <h2>5. Dispute resolution</h2>
      <p>
        In the event of a dispute, consumers may use the{" "}
        <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">Electronic Complaints Book (Livro de Reclamações)</a>{" "}
        or an alternative consumer dispute resolution body: [competent Arbitration Centre, e.g. CIAB — Centro de
        Informação, Mediação e Arbitragem de Consumo (Tribunal Arbitral de Consumo), www.ciab.pt].
      </p>

      <h2>6. Applicable law</h2>
      <p>These terms are governed by Portuguese law.</p>
    </>
  );
}
