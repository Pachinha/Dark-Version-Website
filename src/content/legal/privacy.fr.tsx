import Link from "next/link";
import { COMPANY } from "@/lib/legal";

// Traduction de privacy.pt.tsx — garder les deux à jour. La version portugaise prévaut.
export default function Fr() {
  return (
    <>
      <p>
        {COMPANY.name} respecte votre vie privée et traite vos données personnelles conformément au Règlement général
        sur la protection des données (RGPD — Règlement (UE) 2016/679) et à la loi portugaise n° 58/2019.
      </p>

      <h2>1. Qui est responsable de vos données</h2>
      <p>
        {COMPANY.name}, NIF {COMPANY.nif}, dont le siège est situé {COMPANY.address}.<br />
        Contact pour les questions de confidentialité : {COMPANY.email} · {COMPANY.phone}
      </p>

      <h2>2. Quelles données nous collectons</h2>
      <ul>
        <li><strong>Données du compte :</strong> nom, e-mail, téléphone (facultatif) et mot de passe (stocké chiffré — nous n&apos;y avons jamais accès).</li>
        <li><strong>Adresses :</strong> l&apos;adresse où vous souhaitez recevoir les services et ses coordonnées, pour que le technicien puisse trouver le lieu.</li>
        <li><strong>Position (facultatif) :</strong> si vous choisissez « Utiliser ma position actuelle », votre navigateur partage votre position GPS <em>une seule fois</em>, uniquement pour enregistrer cette adresse. Nous ne suivons jamais votre position.</li>
        <li><strong>Demandes et commandes :</strong> demandes de devis, demandes d&apos;entretien/ramonage, appareils et historique des commandes.</li>
        <li><strong>Registre des consentements :</strong> date et version de cette politique que vous avez acceptée et vos préférences marketing.</li>
        <li><strong>Données de navigation :</strong> uniquement avec votre accord, des statistiques d&apos;utilisation du site via Google Analytics (voir la <Link href="/fr/cookies">Politique de cookies</Link>).</li>
      </ul>

      <h2>3. À quoi servent les données et sur quelle base légale</h2>
      <table>
        <thead>
          <tr><th>Finalité</th><th>Base légale (art. 6 RGPD)</th></tr>
        </thead>
        <tbody>
          <tr><td>Créer et gérer votre compte, répondre aux devis, programmer et réaliser les entretiens</td><td>Exécution d&apos;un contrat et mesures précontractuelles prises à votre demande</td></tr>
          <tr><td>Facturation et obligations fiscales</td><td>Respect d&apos;une obligation légale</td></tr>
          <tr><td>Envoi de nouveautés et de promotions par e-mail</td><td>Consentement (facultatif, vous pouvez le retirer à tout moment)</td></tr>
          <tr><td>Statistiques d&apos;utilisation du site (Google Analytics)</td><td>Consentement, donné dans le bandeau cookies</td></tr>
          <tr><td>Sécurité du site et prévention de la fraude</td><td>Intérêt légitime</td></tr>
        </tbody>
      </table>

      <h2>4. Avec qui nous partageons les données</h2>
      <p>Nous ne vendons pas vos données. Nous faisons uniquement appel à des prestataires (sous-traitants) qui traitent les données pour notre compte :</p>
      <ul>
        <li><strong>Supabase</strong> — hébergement de la base de données et authentification, sur des serveurs situés dans l&apos;Union européenne.</li>
        <li><strong>[Hébergeur du site, p. ex. Vercel]</strong> — hébergement du site.</li>
        <li><strong>Komoot (Photon)</strong> — recherche d&apos;adresses à partir des données d&apos;OpenStreetMap ; il reçoit uniquement le texte saisi dans la recherche ou les coordonnées à convertir en adresse.</li>
        <li><strong>Google Ireland Ltd.</strong> — Google Analytics, uniquement si vous acceptez. Cela peut impliquer un transfert vers les États-Unis dans le cadre du Data Privacy Framework UE-États-Unis.</li>
      </ul>
      <p>Les techniciens de Pachinha accèdent à votre adresse uniquement pour réaliser les services que vous avez demandés.</p>

      <h2>5. Combien de temps nous conservons les données</h2>
      <ul>
        <li>Données du compte, adresses et demandes : tant que le compte est actif, ou jusqu&apos;à [3] ans après la dernière utilisation.</li>
        <li>Documents de facturation : 10 ans, conformément à la législation fiscale portugaise.</li>
        <li>Consentement marketing : jusqu&apos;à ce que vous le retiriez.</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>Vous avez le droit de :</p>
      <ul>
        <li><strong>Accéder</strong> à vos données et les <strong>emporter</strong> (portabilité) — dans l&apos;espace client, sous « A minha conta → Dados &amp; privacidade → Descarregar dados » ;</li>
        <li><strong>Rectifier</strong> vos données — dans l&apos;espace client ;</li>
        <li><strong>Supprimer</strong> votre compte — sous « Dados &amp; privacidade → Apagar conta » ;</li>
        <li><strong>Retirer votre consentement</strong> au marketing ou aux cookies à tout moment, sans affecter le traitement déjà effectué ;</li>
        <li>Vous <strong>opposer</strong> au traitement ou en demander la <strong>limitation</strong>.</li>
      </ul>
      <p>
        Pour exercer l&apos;un de ces droits, utilisez l&apos;espace client (en portugais) ou écrivez à {COMPANY.email}. Nous
        répondons dans un délai maximal d&apos;un mois. Vous avez également le droit d&apos;introduire une réclamation auprès
        de l&apos;autorité portugaise de protection des données, la Comissão Nacional de Proteção de Dados (CNPD) —{" "}
        <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">www.cnpd.pt</a>.
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Les connexions au site sont chiffrées (HTTPS), les mots de passe sont stockés sous forme hachée et chaque client
        ne peut accéder qu&apos;à ses propres données. L&apos;accès administratif est limité au personnel autorisé.
      </p>

      <h2>8. Modifications de cette politique</h2>
      <p>
        Si nous modifions cette politique de manière significative, nous vous en informerons dans l&apos;espace client et,
        si nécessaire, nous vous demanderons à nouveau votre consentement.
      </p>
    </>
  );
}
