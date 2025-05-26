import { Symbol, TypeChecker } from "ts-morph";
import { isSymbol } from "inferred-types";
import { 
    addSymbolsToCache, 
    getSymbol,
    isClassInstance,
    isClassDefinition,
    isVariableSymbol
 } from "~/ast"
import { getTypeChecker } from "./getTypeChecker";
import { SymbolRef } from "~/types";
import { isFunctionVariant,  } from "~/type-guards";

/**
 * Get's the _run-time_ dependencies that the
 * passed in `Symbol` has. 
 * 
 * - returns a tuple of `SymbolRef`'s which point
 * to these symbols.
 * - any new Symbols uncovered during execution are
 * automatically added to the cache.
 */
export function getRuntimeDeps(
    sym: Symbol,
    opts?: { checker: TypeChecker }
): SymbolRef[] {
    const checker = opts?.checker || getTypeChecker(sym);
    const meta = addSymbolsToCache(sym, { checker });
    const runtimeDeps = new Set<SymbolRef>();

    for (const decl of sym.getDeclarations()) {
        decl.forEachDescendant((node) => {
            if (!node || typeof node.getSymbol !== "function") return;
            const refSym = getSymbol(node);
            if (!isSymbol(refSym)) return;

            if (
                isFunctionVariant(refSym) ||
                isClassDefinition(refSym, { checker }) ||
                isClassInstance(refSym, { checker }) ||
                isVariableSymbol(refSym)
            ) {
                const ref = addSymbolsToCache(refSym, { checker });
                runtimeDeps.add(ref.ref);
            }
        });
    }

    return Array.from(runtimeDeps);
}
