import { Symbol, TypeChecker } from "ts-morph";
import { addSymbolsToCache, getSymbol, isTypeSymbol, getTypeChecker } from "~/ast"
import { SymbolRef } from "~/types";
import { isSymbol } from "~/type-guards";

/**
 * Get's the _type_ dependencies that the
 * passed in `Symbol` has. 
 * 
 * - returns a tuple of `SymbolRef`'s which point
 * to these symbols.
 * - any new Symbols uncovered during execution are
 * automatically added to the cache.
 */
export function getTypeDeps(
    sym: Symbol,
    opts?: { checker: TypeChecker }
): SymbolRef[] {
    const checker = opts?.checker || getTypeChecker(sym);
    const meta = addSymbolsToCache(sym, { checker });
    const typeDeps = new Set<SymbolRef>();

    for (const decl of sym.getDeclarations()) {
        decl.forEachDescendant((node) => {
            if (!node || typeof node.getSymbol !== "function") return;
            const refSym = getSymbol(node);
            if (!isSymbol(refSym) || refSym === sym) return;

            if (isTypeSymbol(refSym)) {
                const ref = addSymbolsToCache(refSym, { checker });
                typeDeps.add(ref.ref);
            }
        });
    }

    return Array.from(typeDeps);
}
