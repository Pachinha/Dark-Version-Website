import CookieSettingsButton from "@/components/CookieSettingsButton";

// Traducción de cookies.pt.tsx — mantener ambas al día. Prevalece la versión portuguesa.
export default function Es() {
  return (
    <>
      <p>
        Las cookies son pequeños archivos guardados en su navegador. Solo usamos las cookies necesarias y, si lo
        autoriza, cookies de estadística. No usamos cookies publicitarias.
      </p>

      <h2>Cookies esenciales (siempre activas)</h2>
      <p>Necesarias para que el sitio funcione. No requieren consentimiento.</p>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-…-auth-token</code></td><td>Mantener la sesión iniciada en el área de cliente (Supabase)</td><td>Hasta cerrar la sesión</td></tr>
          <tr><td><code>pachinha_consent</code></td><td>Recordar su elección sobre las cookies</td><td>6 meses</td></tr>
          <tr><td><code>pachinha_lang</code></td><td>Recordar el idioma que eligió</td><td>1 año</td></tr>
        </tbody>
      </table>

      <h2>Cookies de estadística (solo con autorización)</h2>
      <p>
        Nos ayudan a entender cómo se utiliza el sitio (páginas más vistas, duración de la visita). Solo se instalan si
        hace clic en «Aceptar».
      </p>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Distinguir a los visitantes</td><td>2 años</td></tr>
          <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google Analytics</td><td>Mantener el estado de la visita</td><td>2 años</td></tr>
        </tbody>
      </table>

      <h2>Cambiar su elección</h2>
      <p>
        Puede aceptar o rechazar en cualquier momento:{" "}
        <CookieSettingsButton style={{ color: "#bf5b2d", fontWeight: 600, textDecoration: "underline" }} />.
        También puede borrar las cookies en la configuración de su navegador.
      </p>
    </>
  );
}
