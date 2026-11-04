import CookieSettingsButton from "@/components/CookieSettingsButton";

// Translation of cookies.pt.tsx — keep both in step. The Portuguese version prevails.
export default function En() {
  return (
    <>
      <p>
        Cookies are small files stored in your browser. We only use the cookies that are necessary and, if you allow
        it, statistics cookies. We do not use advertising cookies.
      </p>

      <h2>Essential cookies (always on)</h2>
      <p>Needed for the website to work. They do not require consent.</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-…-auth-token</code></td><td>Keeping you signed in to the client area (Supabase)</td><td>Until you sign out</td></tr>
          <tr><td><code>pachinha_consent</code></td><td>Remembering your cookie choice</td><td>6 months</td></tr>
          <tr><td><code>pachinha_lang</code></td><td>Remembering the language you chose</td><td>1 year</td></tr>
        </tbody>
      </table>

      <h2>Statistics cookies (only with your permission)</h2>
      <p>
        They help us understand how the website is used (most viewed pages, length of visit). They are only set if
        you click “Accept”.
      </p>
      <table>
        <thead>
          <tr><th>Name</th><th>Provider</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Distinguishing visitors</td><td>2 years</td></tr>
          <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google Analytics</td><td>Keeping the state of the visit</td><td>2 years</td></tr>
        </tbody>
      </table>

      <h2>Changing your choice</h2>
      <p>
        You can accept or decline at any time:{" "}
        <CookieSettingsButton style={{ color: "#bf5b2d", fontWeight: 600, textDecoration: "underline" }} />.
        You can also delete cookies in your browser settings.
      </p>
    </>
  );
}
