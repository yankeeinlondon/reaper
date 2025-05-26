import { isObject } from "inferred-types";
import { SymbolMeta } from "~/types";

/**
 * Type guard which validates that `val` is of the type
 * `SymbolMeta<"variable">`.
 * 
 * Note: by design this only tests if it meets the criteria
 * for `SymbolMeta__Base<"variable">` so that we it can serve
 * as a type aid in generating the API.
 */
export function isVariableMeta(val: unknown): val is SymbolMeta<"variable"> {
    return isObject(val) 
        && "__kind" in val 
        && val.__kind === "SymbolMeta"
        && "astKind" in val
        && val.astKind === "variable"
}
