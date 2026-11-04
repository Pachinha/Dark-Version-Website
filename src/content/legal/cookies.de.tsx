import CookieSettingsButton from "@/components/CookieSettingsButton";

// Übersetzung von cookies.pt.tsx — beide aktuell halten. Es gilt die portugiesische Fassung.
export default function De() {
  return (
    <>
      <p>
        Cookies sind kleine Dateien, die in Ihrem Browser gespeichert werden. Wir verwenden nur notwendige Cookies und,
        wenn Sie zustimmen, Statistik-Cookies. Wir verwenden keine Werbe-Cookies.
      </p>

      <h2>Notwendige Cookies (immer aktiv)</h2>
      <p>Erforderlich, damit die Website funktioniert. Sie benötigen keine Einwilligung.</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Zweck</th><th>Dauer</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-…-auth-token</code></td><td>Angemeldet bleiben im Kundenbereich (Supabase)</td><td>Bis zur Abmeldung</td></tr>
          <tr><td><code>pachinha_consent</code></td><td>Ihre Cookie-Entscheidung speichern</td><td>6 Monate</td></tr>
          <tr><td><code>pachinha_lang</code></td><td>Die gewählte Sprache speichern</td><td>1 Jahr</td></tr>
        </tbody>
      </table>

      <h2>Statistik-Cookies (nur mit Ihrer Zustimmung)</h2>
      <p>
        Sie helfen uns zu verstehen, wie die Website genutzt wird (meistbesuchte Seiten, Dauer des Besuchs). Sie werden
        nur gesetzt, wenn Sie auf „Akzeptieren“ klicken.
      </p>
      <table>
        <thead>
          <tr><th>Name</th><th>Anbieter</th><th>Zweck</th><th>Dauer</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Besucher unterscheiden</td><td>2 Jahre</td></tr>
          <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google Analytics</td><td>Status des Besuchs speichern</td><td>2 Jahre</td></tr>
        </tbody>
      </table>

      <h2>Ihre Entscheidung ändern</h2>
      <p>
        Sie können jederzeit zustimmen oder ablehnen:{" "}
        <CookieSettingsButton style={{ color: "#bf5b2d", fontWeight: 600, textDecoration: "underline" }} />.
        Sie können Cookies auch in den Einstellungen Ihres Browsers löschen.
      </p>
    </>
  );
}
