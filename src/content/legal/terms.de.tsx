import { COMPANY } from "@/lib/legal";

// Übersetzung von terms.pt.tsx — beide aktuell halten. Es gilt die portugiesische Fassung.
export default function De() {
  return (
    <>
      <h2>1. Angaben zum Betreiber</h2>
      <p>
        Diese Website wird betrieben von {COMPANY.name}, Steuernummer (NIF) {COMPANY.nif}, {COMPANY.address}.
      </p>

      <h2>2. Kundenbereich</h2>
      <p>
        Das Konto ist persönlich. Sie sind dafür verantwortlich, Ihr Passwort geheim zu halten und wahrheitsgemäße
        Angaben zu machen, insbesondere zur Adresse, an der Sie Leistungen erhalten möchten. Sie können Ihr Konto
        jederzeit löschen.
      </p>

      <h2>3. Angebote und Termine</h2>
      <p>
        Über die Website gestellte Angebotsanfragen sind für keine Partei verbindlich. Die vom Kunden angegebenen
        Wartungstermine sind Wünsche: Ein Termin ist erst bestätigt, wenn der Status der Anfrage auf „Agendado“
        (geplant) wechselt. Preise, Bedingungen und Garantien ergeben sich aus dem Angebot oder der Rechnung.
      </p>

      <h2>4. Produktinformationen</h2>
      <p>
        Wir bemühen uns, Beschreibungen und Bilder genau zu halten, es kann jedoch Abweichungen zum Produkt geben. Die
        Verfügbarkeit von Outlet-Artikeln ist auf den vorhandenen Bestand begrenzt.
      </p>

      <h2>5. Streitbeilegung</h2>
      <p>
        Im Streitfall kann sich der Verbraucher an das{" "}
        <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">elektronische Beschwerdebuch (Livro de Reclamações)</a>{" "}
        oder an eine Stelle zur alternativen Beilegung von Verbraucherstreitigkeiten wenden: [zuständiges
        Schiedszentrum, z. B. CIAB — Centro de Informação, Mediação e Arbitragem de Consumo (Tribunal Arbitral de
        Consumo), www.ciab.pt].
      </p>

      <h2>6. Anwendbares Recht</h2>
      <p>Diese Bedingungen unterliegen portugiesischem Recht.</p>
    </>
  );
}
