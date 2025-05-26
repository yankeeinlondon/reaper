import { Symbol } from "ts-morph";
import { getSymbolFlags } from "./getSymbolFlags";
import { getSymbolGenerics } from "./getSymbolGenerics";
import { GenericType } from "~/types";

/**
 * Determines whether the passed in `Symbol` is a
 * _type_ symbol (with or without generic params).
 * 
 * **Note:** use the `isSymbolTypeUtility()` function to
 * distinguish between a _type_ and a _type utility_
 * (which has Generic parameters).
 */
export function isTypeSymbol(sym: Symbol): boolean {
    const flags = getSymbolFlags(sym);

    return flags.includes("Type")
        || flags.includes("TypeAlias")
        || flags.includes("TypeLiteral")
        || flags.includes("Interface");
}

/**
 * Determines whether the passed in `Symbol` is a
 * "Type Utility" which means that:
 * 
 * - it's a _type_, and
 * - it has at least one generic parameter
 */
export function isTypeUtilitySymbol(
    sym: Symbol,
    /** 
     * you may optionally pass in the generics for the symbol
     * if you already have them
     */
    generics?: GenericType[]
): boolean {
    const gen = generics || getSymbolGenerics(sym);
    return isTypeSymbol(sym) && gen.length > 0;
}
