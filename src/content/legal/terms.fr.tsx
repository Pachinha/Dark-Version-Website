import { COMPANY } from "@/lib/legal";

// Traduction de terms.pt.tsx — garder les deux à jour. La version portugaise prévaut.
export default function Fr() {
  return (
    <>
      <h2>1. Identification</h2>
      <p>
        Ce site est exploité par {COMPANY.name}, NIF {COMPANY.nif}, {COMPANY.address}.
      </p>

      <h2>2. Espace client</h2>
      <p>
        Le compte est personnel. Vous êtes responsable de la confidentialité de votre mot de passe et de l&apos;exactitude
        des informations fournies, en particulier l&apos;adresse où vous souhaitez recevoir les services. Vous pouvez
        supprimer votre compte à tout moment.
      </p>

      <h2>3. Devis et rendez-vous</h2>
      <p>
        Les demandes de devis faites sur le site n&apos;engagent aucune des parties. Les dates d&apos;entretien indiquées par le
        client sont des préférences : le rendez-vous n&apos;est confirmé que lorsque l&apos;état de la demande passe à
        « Agendado » (programmé). Les prix, conditions et garanties figurent sur le devis ou la facture.
      </p>

      <h2>4. Informations sur les produits</h2>
      <p>
        Nous faisons notre possible pour que les descriptions et les images soient exactes, mais il peut exister des
        différences par rapport au produit. La disponibilité des articles de l&apos;outlet est limitée au stock existant.
      </p>

      <h2>5. Règlement des litiges</h2>
      <p>
        En cas de litige, le consommateur peut recourir au{" "}
        <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">Livre de réclamations électronique (Livro de Reclamações)</a>{" "}
        ou à un organisme de règlement extrajudiciaire des litiges de consommation : [Centre d&apos;arbitrage compétent,
        p. ex. CIAB — Centro de Informação, Mediação e Arbitragem de Consumo (Tribunal Arbitral de Consumo), www.ciab.pt].
      </p>

      <h2>6. Droit applicable</h2>
      <p>Les présentes conditions sont régies par le droit portugais.</p>
    </>
  );
}
