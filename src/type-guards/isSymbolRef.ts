import { isString } from "inferred-types";
import { SYMBOL_REF_PREFIXES } from "~/constants";
import { SymbolRef } from "~/types/reference-types";

export function isSymbolRef(val: unknown): val is SymbolRef {
    return isString(val) && SYMBOL_REF_PREFIXES.some(i => val.startsWith(i))
}
