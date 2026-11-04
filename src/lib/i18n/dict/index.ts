import type { Locale } from "../config";
import { CLIENT_KEYS, type ClientDict, type Dict } from "./types";
import { pt } from "./pt";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";

export const DICTIONARIES: Record<Locale, Dict> = { pt, en, es, fr, de };

export function clientDict(t: Dict): ClientDict {
  return Object.fromEntries(CLIENT_KEYS.map((k) => [k, t[k]])) as ClientDict;
}
