import { Symbol } from "ts-morph";
import { SymbolScope } from "~/types";
import { getSymbolKind } from "./utils/getSymbolKind";
import { isExportedSymbol } from "~/type-guards";

/**
 * Determines the scope of the given symbol.
 * 
 * Returns:
 *  - `local` if the symbol is defined locally and not exported,
 *  - `module` if the symbol is defined and exported within the scope of
 * the analyzed project,
 *  - `external` if the symbol is from an external library
 */
export function getSymbolScope(symbol: Symbol): SymbolScope {
    const declarations = symbol.getDeclarations();

    // If there are no declarations, it's likely an external symbol
    if (
        declarations.length === 0 ||
        getSymbolKind(symbol) === "external-type"
    ) {
        return 'external';
    }

    // Check if the symbol is declared in an external library
    const firstDeclaration = declarations[0];
    const sourceFile = firstDeclaration.getSourceFile();

    if (sourceFile.isInNodeModules()) {
        return 'external';
    }


    if (isExportedSymbol(symbol)) {
        return 'module';
    }

    // If not exported and not from an external library, it's local
    return 'local';
}
