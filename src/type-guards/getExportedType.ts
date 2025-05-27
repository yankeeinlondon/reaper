import type { Symbol } from "ts-morph";
import type { ExportType } from "~/types";
import { Node, SyntaxKind } from "ts-morph";

function hasExportModifier(declaration: Node): boolean {
    return Node.isModifierable(declaration)
      && declaration.getModifiers().some(mod =>
          mod.getKind() === SyntaxKind.ExportKeyword,
      );
}

function hasDefaultModifier(declaration: Node): boolean {
    return Node.isModifierable(declaration)
      && declaration.getModifiers().some(mod =>
          mod.getKind() === SyntaxKind.DefaultKeyword,
      );
}

/**
 * Checks whether the passed in `Symbol` is _exported_ and what
 * kind of export it is.
 *
 * - `false` means it is **not exported**
 * - `named`, `default` and `re-exported` indicate the kind of
 * export that it is.
 */
export function getExportType(symbol: Symbol): ExportType {
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) {
        return false;
    }

    // Check if the symbol is imported (imported symbols are considered re-exported)
    if (declarations.some(decl => Node.isImportSpecifier(decl) || Node.isImportClause(decl))) {
        return "re-exported";
    }

    for (const declaration of declarations) {
        const parent = declaration.getParent();

        // For variable declarations, check the parent VariableStatement
        if (Node.isVariableDeclaration(declaration) && parent && Node.isVariableStatement(parent)) {
            if (hasDefaultModifier(parent))
                return "default";
            if (hasExportModifier(parent))
                return "named";
        }

        // For other declarations, check for export/default keyword directly
        if (
            Node.isFunctionDeclaration(declaration)
      || Node.isClassDeclaration(declaration)
      || Node.isInterfaceDeclaration(declaration)
      || Node.isEnumDeclaration(declaration)
      || Node.isTypeAliasDeclaration(declaration)
        ) {
            if (hasDefaultModifier(declaration))
                return "default";
            if (hasExportModifier(declaration))
                return "named";
        }
    }

    // Check for explicit re-exports (e.g., export { Foo } from './foo')
    for (const declaration of declarations) {
        const sourceFile = declaration.getSourceFile();
        const exportDeclarations = sourceFile.getExportDeclarations();
        for (const exportDecl of exportDeclarations) {
            const namedExports = exportDecl.getNamedExports();
            for (const namedExport of namedExports) {
                const exportedSymbol = namedExport.getSymbol();
                if (exportedSymbol && exportedSymbol.getName() === symbol.getName()) {
                    return "re-exported";
                }
            }
        }
    }

    return false;
}
