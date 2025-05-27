import type { SymbolMeta } from "~/types";
import { isObject } from "inferred-types";
/**
 * type guard which validates that `val` is a `SymbolMeta`
 */
export function isSymbolMeta(val: unknown): val is SymbolMeta {
    return isObject(val) && "__kind" in val && val.__kind === "SymbolMeta";
}
