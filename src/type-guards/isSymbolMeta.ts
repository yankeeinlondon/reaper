import { isArray, isObject, isUndefined } from "inferred-types"
import { SymbolMeta } from "src/types";



/**
 * Type guard which checks whether the passed in value `SymbolInfo`
 * dictionary.
 */
export const isSymbolMeta = (val: unknown): val is SymbolMeta => {
  return isObject(val) && "name" in val  && isUndefined(val.dependsOn);
};


export const isSymbolMetaWithDependencies =  (val: unknown) => {
    return isObject(val) && "name" in val  && isArray(val.dependsOn)
}
