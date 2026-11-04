import Link from "next/link";
import { COMPANY } from "@/lib/legal";

// Traducción de privacy.pt.tsx — mantener ambas al día. Prevalece la versión portuguesa.
export default function Es() {
  return (
    <>
      <p>
        {COMPANY.name} respeta su privacidad y trata sus datos personales de acuerdo con el Reglamento General de
        Protección de Datos (RGPD — Reglamento (UE) 2016/679) y la Ley portuguesa n.º 58/2019.
      </p>

      <h2>1. Quién es el responsable de sus datos</h2>
      <p>
        {COMPANY.name}, NIF {COMPANY.nif}, con domicilio social en {COMPANY.address}.<br />
        Contacto para cuestiones de privacidad: {COMPANY.email} · {COMPANY.phone}
      </p>

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li><strong>Datos de la cuenta:</strong> nombre, email, teléfono (opcional) y contraseña (guardada cifrada — nunca tenemos acceso a ella).</li>
        <li><strong>Direcciones:</strong> la dirección donde desea recibir los servicios y sus coordenadas, para que el técnico pueda llegar al lugar.</li>
        <li><strong>Ubicación (opcional):</strong> si elige «Usar mi ubicación actual», su navegador comparte la posición GPS <em>una sola vez</em>, solo para guardar esa dirección. Nunca seguimos su ubicación.</li>
        <li><strong>Solicitudes y pedidos:</strong> solicitudes de presupuesto, solicitudes de mantenimiento/limpieza, equipos e historial de pedidos.</li>
        <li><strong>Registro de consentimientos:</strong> fecha y versión de esta política que aceptó y sus preferencias de marketing.</li>
        <li><strong>Datos de navegación:</strong> solo con su autorización, estadísticas de uso del sitio a través de Google Analytics (consulte la <Link href="/es/cookies">Política de Cookies</Link>).</li>
      </ul>

      <h2>3. Para qué usamos los datos y con qué base legal</h2>
      <table>
        <thead>
          <tr><th>Finalidad</th><th>Base legal (art. 6 RGPD)</th></tr>
        </thead>
        <tbody>
          <tr><td>Crear y gestionar su cuenta, responder a presupuestos, programar y realizar mantenimientos</td><td>Ejecución de un contrato y medidas precontractuales a petición suya</td></tr>
          <tr><td>Facturación y obligaciones fiscales</td><td>Cumplimiento de una obligación legal</td></tr>
          <tr><td>Envío de novedades y promociones por email</td><td>Consentimiento (opcional, puede retirarlo en cualquier momento)</td></tr>
          <tr><td>Estadísticas de uso del sitio (Google Analytics)</td><td>Consentimiento, dado en el aviso de cookies</td></tr>
          <tr><td>Seguridad del sitio y prevención del fraude</td><td>Interés legítimo</td></tr>
        </tbody>
      </table>

      <h2>4. Con quién compartimos los datos</h2>
      <p>No vendemos sus datos. Solo recurrimos a proveedores de servicios (encargados del tratamiento) que tratan los datos por cuenta nuestra:</p>
      <ul>
        <li><strong>Supabase</strong> — alojamiento de la base de datos y autenticación, en servidores de la Unión Europea.</li>
        <li><strong>[Proveedor de alojamiento del sitio, p. ej. Vercel]</strong> — alojamiento del sitio.</li>
        <li><strong>Komoot (Photon)</strong> — búsqueda de direcciones a partir de datos de OpenStreetMap; solo recibe el texto que escribe en la búsqueda o las coordenadas que hay que convertir en dirección.</li>
        <li><strong>Google Ireland Ltd.</strong> — Google Analytics, solo si lo acepta. Puede implicar transferencias a EE. UU. al amparo del Marco de Privacidad de Datos UE-EE. UU.</li>
      </ul>
      <p>Los técnicos de Pachinha acceden a su dirección solo para realizar los servicios que ha solicitado.</p>

      <h2>5. Durante cuánto tiempo guardamos los datos</h2>
      <ul>
        <li>Datos de la cuenta, direcciones y solicitudes: mientras la cuenta esté activa, o hasta [3] años después del último uso.</li>
        <li>Documentos de facturación: 10 años, según la ley fiscal portuguesa.</li>
        <li>Consentimiento de marketing: hasta que lo retire.</li>
      </ul>

      <h2>6. Sus derechos</h2>
      <p>Tiene derecho a:</p>
      <ul>
        <li><strong>Acceder</strong> a sus datos y <strong>llevárselos</strong> (portabilidad) — en el área de cliente, en «A minha conta → Dados &amp; privacidade → Descarregar dados»;</li>
        <li><strong>Rectificar</strong> sus datos — en el área de cliente;</li>
        <li><strong>Suprimir</strong> su cuenta — en «Dados &amp; privacidade → Apagar conta»;</li>
        <li><strong>Retirar el consentimiento</strong> de marketing o de cookies en cualquier momento, sin que afecte al tratamiento ya realizado;</li>
        <li><strong>Oponerse</strong> al tratamiento o pedir su <strong>limitación</strong>.</li>
      </ul>
      <p>
        Para ejercer cualquier derecho, use el área de cliente (en portugués) o escriba a {COMPANY.email}. Respondemos
        en el plazo máximo de un mes. También tiene derecho a presentar una reclamación ante la autoridad portuguesa de
        protección de datos, la Comissão Nacional de Proteção de Dados (CNPD) — <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">www.cnpd.pt</a>.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Las conexiones al sitio están cifradas (HTTPS), las contraseñas se guardan con hash y cada cliente solo puede
        acceder a sus propios datos. El acceso administrativo está limitado al personal autorizado.
      </p>

      <h2>8. Cambios en esta política</h2>
      <p>
        Si modificamos esta política de forma significativa, le avisaremos en el área de cliente y, cuando sea
        necesario, volveremos a pedir su consentimiento.
      </p>
    </>
  );
}
