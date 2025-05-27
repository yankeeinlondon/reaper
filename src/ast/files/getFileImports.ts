import type { SourceFile, Symbol } from "ts-morph";
import { isTypeSymbol } from "~/ast/utils";

export type ImportSymbol = {
    symbol: Symbol;
    /** true if imported with the `type` keyword */
    typeSpecifier: boolean;
    /** true if the symbol is a type (type alias, interface, etc.) */
    isTypeSymbol: boolean;
    /** the name as imported (could be alias) */
    importName: string;
    /** the module specifier (e.g. './other') */
    moduleSpecifier: string;
};

/**
 * Returns all import symbols from a file as a flat array, with metadata for each symbol.
 *
 * - `typeSpecifier`: true if imported with `import type`.
 * - `isTypeSymbol`: true if the symbol is a type (type alias, interface, etc.).
 * - Handles named, namespace, and default imports.
 */
export function getFileImports(file: SourceFile): ImportSymbol[] {
    const importDecls = file.getImportDeclarations();
    const result: ImportSymbol[] = [];
    for (const decl of importDecls) {
        const moduleSpecifier = decl.getModuleSpecifierValue();
        const declIsTypeOnly = decl.isTypeOnly();
        // Named imports
        for (const namedImport of decl.getNamedImports()) {
            const sym = namedImport.getNameNode().getSymbol();
            if (!sym) continue;
            // If the parent import declaration is type-only, all named imports are type-only
            const typeSpecifier = declIsTypeOnly || namedImport.isTypeOnly();
            const isType = isTypeSymbol(sym);
            const importName = namedImport.getName();
            result.push({
                symbol: sym,
                typeSpecifier,
                isTypeSymbol: isType,
                importName,
                moduleSpecifier
            });
        }
        // Namespace import (import * as X from ...)
        const nsImport = decl.getNamespaceImport();
        if (nsImport) {
            const sym = nsImport.getSymbol();
            if (sym) {
                result.push({
                    symbol: sym,
                    typeSpecifier: false,
                    isTypeSymbol: false, // Namespace imports are always runtime
                    importName: nsImport.getText(),
                    moduleSpecifier
                });
            }
        }
        // Default import (import X from ...)
        const defaultImport = decl.getDefaultImport();
        if (defaultImport) {
            const sym = defaultImport.getSymbol();
            if (sym) {
                const isType = isTypeSymbol(sym);
                result.push({
                    symbol: sym,
                    typeSpecifier: false,
                    isTypeSymbol: isType,
                    importName: defaultImport.getText(),
                    moduleSpecifier
                });
            }
        }
    }
    return result;
}
