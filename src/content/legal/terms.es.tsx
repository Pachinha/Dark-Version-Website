import { COMPANY } from "@/lib/legal";

// Traducción de terms.pt.tsx — mantener ambas al día. Prevalece la versión portuguesa.
export default function Es() {
  return (
    <>
      <h2>1. Identificación</h2>
      <p>
        Este sitio es explotado por {COMPANY.name}, NIF {COMPANY.nif}, {COMPANY.address}.
      </p>

      <h2>2. Área de cliente</h2>
      <p>
        La cuenta es personal. Usted es responsable de mantener la contraseña en secreto y de indicar datos veraces, en
        particular la dirección donde desea recibir los servicios. Puede eliminar la cuenta en cualquier momento.
      </p>

      <h2>3. Presupuestos y citas</h2>
      <p>
        Las solicitudes de presupuesto hechas en el sitio no son vinculantes para ninguna de las partes. Las fechas de
        mantenimiento indicadas por el cliente son preferencias: la cita solo queda confirmada cuando el estado de la
        solicitud pasa a «Agendado» (programado). Los precios, condiciones y garantías figuran en el presupuesto o en
        la factura.
      </p>

      <h2>4. Información sobre los productos</h2>
      <p>
        Hacemos todo lo posible para que las descripciones e imágenes sean exactas, pero puede haber diferencias con
        respecto al producto. La disponibilidad de los artículos del outlet está limitada a las existencias.
      </p>

      <h2>5. Resolución de litigios</h2>
      <p>
        En caso de litigio, el consumidor puede recurrir al{" "}
        <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">Libro de Reclamaciones Electrónico (Livro de Reclamações)</a>{" "}
        o a una entidad de resolución alternativa de litigios de consumo: [Centro de Arbitraje competente, p. ej. CIAB —
        Centro de Informação, Mediação e Arbitragem de Consumo (Tribunal Arbitral de Consumo), www.ciab.pt].
      </p>

      <h2>6. Ley aplicable</h2>
      <p>Estos términos se rigen por la ley portuguesa.</p>
    </>
  );
}
