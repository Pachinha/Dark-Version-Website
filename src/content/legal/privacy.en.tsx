import Link from "next/link";
import { COMPANY } from "@/lib/legal";

// Translation of privacy.pt.tsx — keep both in step. The Portuguese version prevails.
export default function En() {
  return (
    <>
      <p>
        {COMPANY.name} respects your privacy and processes your personal data in accordance with the General Data
        Protection Regulation (GDPR — Regulation (EU) 2016/679) and Portuguese Law no. 58/2019.
      </p>

      <h2>1. Who is responsible for your data</h2>
      <p>
        {COMPANY.name}, tax no. {COMPANY.nif}, registered office at {COMPANY.address}.<br />
        Contact for privacy matters: {COMPANY.email} · {COMPANY.phone}
      </p>

      <h2>2. What data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, phone (optional) and password (stored encrypted — we never have access to it).</li>
        <li><strong>Addresses:</strong> the address where you want to receive services and its coordinates, so that the technician can find the place.</li>
        <li><strong>Location (optional):</strong> if you choose “Use my current location”, your browser shares your GPS position <em>only once</em>, just to save that address. We never track your location.</li>
        <li><strong>Requests and orders:</strong> quote requests, maintenance/cleaning requests, appliances and order history.</li>
        <li><strong>Consent records:</strong> the date and version of this policy you accepted and your marketing preferences.</li>
        <li><strong>Browsing data:</strong> only with your permission, website usage statistics through Google Analytics (see the <Link href="/en/cookies">Cookie Policy</Link>).</li>
      </ul>

      <h2>3. What we use the data for and on what legal basis</h2>
      <table>
        <thead>
          <tr><th>Purpose</th><th>Legal basis (Art. 6 GDPR)</th></tr>
        </thead>
        <tbody>
          <tr><td>Creating and managing your account, answering quote requests, scheduling and carrying out maintenance</td><td>Performance of a contract and pre-contractual steps at your request</td></tr>
          <tr><td>Invoicing and tax obligations</td><td>Compliance with a legal obligation</td></tr>
          <tr><td>Sending news and promotions by email</td><td>Consent (optional, you can withdraw it at any time)</td></tr>
          <tr><td>Website usage statistics (Google Analytics)</td><td>Consent, given in the cookie notice</td></tr>
          <tr><td>Website security and fraud prevention</td><td>Legitimate interest</td></tr>
        </tbody>
      </table>

      <h2>4. Who we share the data with</h2>
      <p>We do not sell your data. We only use service providers (processors) who process data on our behalf:</p>
      <ul>
        <li><strong>Supabase</strong> — database hosting and authentication, on servers in the European Union.</li>
        <li><strong>[Website hosting provider, e.g. Vercel]</strong> — website hosting.</li>
        <li><strong>Komoot (Photon)</strong> — address search based on OpenStreetMap data; it only receives the text you type in the search or the coordinates to be converted into an address.</li>
        <li><strong>Google Ireland Ltd.</strong> — Google Analytics, only if you accept. This may involve transfers to the USA under the EU-US Data Privacy Framework.</li>
      </ul>
      <p>Pachinha&apos;s technicians access your address only to carry out the services you requested.</p>

      <h2>5. How long we keep the data</h2>
      <ul>
        <li>Account data, addresses and requests: while the account is active, or up to [3] years after its last use.</li>
        <li>Invoicing documents: 10 years, as required by Portuguese tax law.</li>
        <li>Marketing consent: until you withdraw it.</li>
      </ul>

      <h2>6. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> your data and <strong>take it with you</strong> (portability) — in the client area under “A minha conta → Dados &amp; privacidade → Descarregar dados”;</li>
        <li><strong>Correct</strong> your data — in the client area;</li>
        <li><strong>Delete</strong> your account — under “Dados &amp; privacidade → Apagar conta”;</li>
        <li><strong>Withdraw your consent</strong> to marketing or cookies at any time, without affecting processing already carried out;</li>
        <li><strong>Object</strong> to processing or ask for it to be <strong>restricted</strong>.</li>
      </ul>
      <p>
        To exercise any right, use the client area (in Portuguese) or write to {COMPANY.email}. We reply within one
        month at most. You also have the right to lodge a complaint with the Portuguese data protection authority,
        the Comissão Nacional de Proteção de Dados (CNPD) — <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">www.cnpd.pt</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        Connections to the website are encrypted (HTTPS), passwords are stored hashed and each client can only access
        their own data. Administrative access is limited to authorised staff.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        If we change this policy significantly, we will let you know in the client area and, where necessary, ask for
        your consent again.
      </p>
    </>
  );
}
