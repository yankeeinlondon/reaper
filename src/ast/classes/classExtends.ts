import type { Symbol } from "ts-morph";
import { Node, SyntaxKind } from "ts-morph";

/**
 * Get's the `Symbol`'s for the properties which this class _extends_.
 */
export function classExtends(
    sym: Symbol,
): Symbol[] {
    const decl = sym.getDeclarations()[0];
    if (!decl || !Node.isClassDeclaration(decl))
        return [];
    const heritageClauses = decl.getHeritageClauses();
    for (const clause of heritageClauses) {
        if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
            return clause.getTypeNodes()
                .map(typeNode => typeNode.getSymbol())
                .filter((s): s is Symbol => !!s);
        }
    }
    return [];
}
