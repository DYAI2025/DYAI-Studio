import type { Locale } from "@/data/model";
import { en, type Copy, type LayerRole } from "./en";
import { de } from "./de";

export type { Copy, LayerRole };
export const copy: Record<Locale, Copy> = { EN: en, DE: de };
