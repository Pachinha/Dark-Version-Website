import type { FormState } from "@/app/actions/auth";

export default function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <p className="alert alert-error" role="alert">{state.error}</p>;
  if (state?.success) return <p className="alert alert-success" role="status">{state.success}</p>;
  return null;
}
