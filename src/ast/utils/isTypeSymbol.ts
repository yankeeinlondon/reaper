import type { Symbol } from "ts-morph";
import type { GenericType } from "~/types";
import { getSymbolFlags } from "./getSymbolFlags";
import { getSymbolGenerics } from "./getSymbolGenerics";

/**
 * Determines whether the passed in `Symbol` is a
 * _type_ symbol (with or without generic params).
 *
 * **Note:** use the `isSymbolTypeUtility()` function to
 * distinguish between a _type_ and a _type utility_
 * (which has Generic parameters).
 */
export function isTypeSymbol(sym: Symbol): boolean {
    // If this is an import alias, resolve to the original symbol
    const target = typeof sym.getAliasedSymbol === "function" && sym.getAliasedSymbol() || sym;
    const flags = getSymbolFlags(target);
    const isFlagType =
        flags.includes("Type") ||
        flags.includes("TypeAlias") ||
        flags.includes("TypeLiteral") ||
        flags.includes("Interface");
    const decls = target.getDeclarations();
    const isDeclType = decls.some(decl => {
        const kind = decl.getKindName();
        return (
            kind === "TypeAliasDeclaration" ||
            kind === "InterfaceDeclaration" ||
            kind === "TypeParameter" ||
            kind === "TypeLiteral"
        );
    });
    return isFlagType || isDeclType;
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
    generics?: GenericType[],
): boolean {
    const gen = generics || getSymbolGenerics(sym);
    return isTypeSymbol(sym) && gen.length > 0;
}
