import Link from "next/link";
import { COMPANY } from "@/lib/legal";

// Übersetzung von privacy.pt.tsx — beide aktuell halten. Es gilt die portugiesische Fassung.
export default function De() {
  return (
    <>
      <p>
        {COMPANY.name} respektiert Ihre Privatsphäre und verarbeitet Ihre personenbezogenen Daten gemäß der
        Datenschutz-Grundverordnung (DSGVO — Verordnung (EU) 2016/679) und dem portugiesischen Gesetz Nr. 58/2019.
      </p>

      <h2>1. Wer für Ihre Daten verantwortlich ist</h2>
      <p>
        {COMPANY.name}, Steuernummer (NIF) {COMPANY.nif}, mit Sitz in {COMPANY.address}.<br />
        Kontakt für Datenschutzfragen: {COMPANY.email} · {COMPANY.phone}
      </p>

      <h2>2. Welche Daten wir erheben</h2>
      <ul>
        <li><strong>Kontodaten:</strong> Name, E-Mail, Telefon (optional) und Passwort (verschlüsselt gespeichert — wir haben nie Zugriff darauf).</li>
        <li><strong>Adressen:</strong> die Adresse, an der Sie Leistungen erhalten möchten, und deren Koordinaten, damit der Techniker den Ort findet.</li>
        <li><strong>Standort (optional):</strong> Wenn Sie „Meinen aktuellen Standort verwenden“ wählen, teilt Ihr Browser Ihre GPS-Position <em>ein einziges Mal</em>, nur um diese Adresse zu speichern. Wir verfolgen Ihren Standort nie.</li>
        <li><strong>Anfragen und Bestellungen:</strong> Angebotsanfragen, Wartungs- und Reinigungsanfragen, Geräte und Bestellhistorie.</li>
        <li><strong>Einwilligungsnachweise:</strong> Datum und Version dieser Erklärung, der Sie zugestimmt haben, sowie Ihre Marketing-Einstellungen.</li>
        <li><strong>Nutzungsdaten:</strong> nur mit Ihrer Zustimmung, Statistiken zur Nutzung der Website über Google Analytics (siehe <Link href="/de/cookies">Cookie-Richtlinie</Link>).</li>
      </ul>

      <h2>3. Wofür wir die Daten verwenden und auf welcher Rechtsgrundlage</h2>
      <table>
        <thead>
          <tr><th>Zweck</th><th>Rechtsgrundlage (Art. 6 DSGVO)</th></tr>
        </thead>
        <tbody>
          <tr><td>Erstellung und Verwaltung Ihres Kontos, Beantwortung von Angebotsanfragen, Planung und Durchführung von Wartungen</td><td>Vertragserfüllung und vorvertragliche Maßnahmen auf Ihre Anfrage</td></tr>
          <tr><td>Rechnungsstellung und steuerliche Pflichten</td><td>Erfüllung einer rechtlichen Verpflichtung</td></tr>
          <tr><td>Versand von Neuigkeiten und Angeboten per E-Mail</td><td>Einwilligung (optional, jederzeit widerrufbar)</td></tr>
          <tr><td>Statistiken zur Nutzung der Website (Google Analytics)</td><td>Einwilligung, erteilt im Cookie-Hinweis</td></tr>
          <tr><td>Sicherheit der Website und Betrugsprävention</td><td>Berechtigtes Interesse</td></tr>
        </tbody>
      </table>

      <h2>4. An wen wir Daten weitergeben</h2>
      <p>Wir verkaufen Ihre Daten nicht. Wir nutzen nur Dienstleister (Auftragsverarbeiter), die Daten in unserem Auftrag verarbeiten:</p>
      <ul>
        <li><strong>Supabase</strong> — Hosting der Datenbank und Authentifizierung, auf Servern in der Europäischen Union.</li>
        <li><strong>[Hosting-Anbieter der Website, z. B. Vercel]</strong> — Hosting der Website.</li>
        <li><strong>Komoot (Photon)</strong> — Adresssuche auf Basis von OpenStreetMap-Daten; erhält nur den Text, den Sie in die Suche eingeben, oder die Koordinaten, die in eine Adresse umgewandelt werden sollen.</li>
        <li><strong>Google Ireland Ltd.</strong> — Google Analytics, nur wenn Sie zustimmen. Dies kann eine Übermittlung in die USA im Rahmen des EU-US Data Privacy Framework umfassen.</li>
      </ul>
      <p>Die Techniker von Pachinha greifen nur auf Ihre Adresse zu, um die von Ihnen angefragten Leistungen zu erbringen.</p>

      <h2>5. Wie lange wir die Daten speichern</h2>
      <ul>
        <li>Kontodaten, Adressen und Anfragen: solange das Konto aktiv ist, oder bis zu [3] Jahre nach der letzten Nutzung.</li>
        <li>Rechnungsunterlagen: 10 Jahre, gemäß portugiesischem Steuerrecht.</li>
        <li>Marketing-Einwilligung: bis Sie sie widerrufen.</li>
      </ul>

      <h2>6. Ihre Rechte</h2>
      <p>Sie haben das Recht:</p>
      <ul>
        <li>auf <strong>Auskunft</strong> über Ihre Daten und darauf, sie <strong>mitzunehmen</strong> (Datenübertragbarkeit) — im Kundenbereich unter „A minha conta → Dados &amp; privacidade → Descarregar dados“;</li>
        <li>Ihre Daten zu <strong>berichtigen</strong> — im Kundenbereich;</li>
        <li>Ihr Konto zu <strong>löschen</strong> — unter „Dados &amp; privacidade → Apagar conta“;</li>
        <li>Ihre <strong>Einwilligung</strong> in Marketing oder Cookies jederzeit zu <strong>widerrufen</strong>, ohne dass die bereits erfolgte Verarbeitung berührt wird;</li>
        <li>der Verarbeitung zu <strong>widersprechen</strong> oder deren <strong>Einschränkung</strong> zu verlangen.</li>
      </ul>
      <p>
        Um ein Recht auszuüben, nutzen Sie den Kundenbereich (auf Portugiesisch) oder schreiben Sie an {COMPANY.email}.
        Wir antworten innerhalb von höchstens einem Monat. Sie haben außerdem das Recht, Beschwerde bei der
        portugiesischen Datenschutzbehörde, der Comissão Nacional de Proteção de Dados (CNPD), einzulegen —{" "}
        <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">www.cnpd.pt</a>.
      </p>

      <h2>7. Sicherheit</h2>
      <p>
        Die Verbindungen zur Website sind verschlüsselt (HTTPS), Passwörter werden gehasht gespeichert und jeder Kunde
        kann nur auf seine eigenen Daten zugreifen. Der administrative Zugang ist auf befugtes Personal beschränkt.
      </p>

      <h2>8. Änderungen dieser Erklärung</h2>
      <p>
        Wenn wir diese Erklärung wesentlich ändern, informieren wir Sie im Kundenbereich und bitten Sie, falls
        erforderlich, erneut um Ihre Einwilligung.
      </p>
    </>
  );
}
