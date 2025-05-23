import { isObject, isUndefined } from "inferred-types"
import { SymbolsMeta } from "src/types";



/**
 * Type guard which checks whether the passed in value `SymbolInfo`
 * dictionary.
 */
export const isSymbolMeta = (val: unknown): val is SymbolsMeta => {
  return isObject(val) && "name" in val  && isUndefined(val.dependsOn);
};

