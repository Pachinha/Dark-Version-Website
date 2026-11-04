import CookieSettingsButton from "@/components/CookieSettingsButton";

// Traduction de cookies.pt.tsx — garder les deux à jour. La version portugaise prévaut.
export default function Fr() {
  return (
    <>
      <p>
        Les cookies sont de petits fichiers enregistrés dans votre navigateur. Nous utilisons uniquement les cookies
        nécessaires et, si vous l&apos;autorisez, des cookies de statistiques. Nous n&apos;utilisons pas de cookies publicitaires.
      </p>

      <h2>Cookies essentiels (toujours actifs)</h2>
      <p>Nécessaires au fonctionnement du site. Ils ne requièrent pas de consentement.</p>
      <table>
        <thead>
          <tr><th>Nom</th><th>Finalité</th><th>Durée</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-…-auth-token</code></td><td>Garder la session ouverte dans l&apos;espace client (Supabase)</td><td>Jusqu&apos;à la déconnexion</td></tr>
          <tr><td><code>pachinha_consent</code></td><td>Mémoriser votre choix concernant les cookies</td><td>6 mois</td></tr>
          <tr><td><code>pachinha_lang</code></td><td>Mémoriser la langue choisie</td><td>1 an</td></tr>
        </tbody>
      </table>

      <h2>Cookies de statistiques (uniquement avec votre accord)</h2>
      <p>
        Ils nous aident à comprendre comment le site est utilisé (pages les plus vues, durée de la visite). Ils ne sont
        installés que si vous cliquez sur « Accepter ».
      </p>
      <table>
        <thead>
          <tr><th>Nom</th><th>Fournisseur</th><th>Finalité</th><th>Durée</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Distinguer les visiteurs</td><td>2 ans</td></tr>
          <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google Analytics</td><td>Conserver l&apos;état de la visite</td><td>2 ans</td></tr>
        </tbody>
      </table>

      <h2>Modifier votre choix</h2>
      <p>
        Vous pouvez accepter ou refuser à tout moment :{" "}
        <CookieSettingsButton style={{ color: "#bf5b2d", fontWeight: 600, textDecoration: "underline" }} />.
        Vous pouvez aussi supprimer les cookies dans les paramètres de votre navigateur.
      </p>
    </>
  );
}
