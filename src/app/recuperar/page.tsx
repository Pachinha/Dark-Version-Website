import Shell from "@/components/account/Shell";
import RecuperarForm from "./RecuperarForm";

// A Shell é um componente de servidor (lê a língua e o catálogo do rodapé); o formulário é o cliente.
export default function RecuperarPage() {
  return (
    <Shell>
      <RecuperarForm />
    </Shell>
  );
}
