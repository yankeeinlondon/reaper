import type { Project, Symbol, TypeChecker } from "ts-morph";
import type { SymbolMeta } from "~/types";
import { isSymbol, isSymbolMeta } from "~/type-guards";

/**
 * Provides the **ts-morph** `TypeChecker` from either
 * a `Symbol` or `Project`.
 */
export function getTypeChecker(ast: Project | Symbol | SymbolMeta): TypeChecker {
    return isSymbol(ast)
        ? ast.getDeclarations()[0].getSourceFile().getProject().getTypeChecker()
        : isSymbolMeta(ast)
            ? getTypeChecker(ast.symbol)
            : ast.getTypeChecker();
}
