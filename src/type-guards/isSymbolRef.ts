import type { SymbolRef } from "~/types/reference-types";
import { isString } from "inferred-types";
import { SYMBOL_REF_PREFIXES } from "~/constants";

export function isSymbolRef(val: unknown): val is SymbolRef {
    return isString(val) && SYMBOL_REF_PREFIXES.some(i => val.startsWith(i));
}
