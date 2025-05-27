import type { SymbolMeta } from "~/types";
import { isObject } from "inferred-types";

/**
 * Type guard which validates that `val` is of the type
 * `SymbolMeta<"class">`.
 *
 * Note: by design this only tests if it meets the criteria
 * for `SymbolMeta__Base<"class">` so that we it can serve
 * as a type aid in generating the API.
 */
export function isClassMeta(val: unknown): val is SymbolMeta<"class"> {
    return isObject(val)
      && "__kind" in val
      && val.__kind === "SymbolMeta"
      && "astKind" in val
      && val.astKind === "class";
}
