import type { pt } from "./pt";

// O dicionário português define a forma; as outras línguas têm de a seguir.
export type Dict = typeof pt;

// Parte do dicionário que vai para o browser (componentes interativos).
export const CLIENT_KEYS = ["lang", "cookies", "labels", "availability", "place", "phone", "quote", "service"] as const;
export type ClientDict = Pick<Dict, (typeof CLIENT_KEYS)[number]>;
