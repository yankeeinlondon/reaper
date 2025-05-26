import { isObject } from "inferred-types";
import { SymbolMeta } from "~/types";

/**
 * Type guard which validates that `val` is of the type
 * `SymbolMeta<"function">`.
 * 
 * Note: by design this only tests if it meets the criteria
 * for `SymbolMeta__Base<"function">` so that we it can serve
 * as a type aid in generating the API.
 */
export function isFunctionMeta(val: unknown): val is SymbolMeta<"function"> {
    return isObject(val) 
        && "__kind" in val 
        && val.__kind === "SymbolMeta"
        && "astKind" in val
        && val.astKind === "function"
}
