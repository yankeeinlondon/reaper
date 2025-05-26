import { Node, Symbol, VariableDeclarationKind } from "ts-morph";

/**
 * The "scope" in which a variable was declared
 */
export type VariableScope = "var" | "const" | "let";

/**
 * Indicates whether a symbol is of a "variable" type.
 * 
 * - `false` indicates it is not
 * - `var`, `const`, or `let` indicate it **is** a variable as 
 * well as what scope the variable was declared with
 */
export type TryVariableScope = false | VariableScope;


/**
 * **isVariable**`(sym)`
 * 
 * Tests whether the passed in `Symbol` is a _variable_ symbol and
 * returns:
 * 
 *  - `false` if _not_ a variable symbol
 *  - `var`, `const`, or `let` to indicate what predicate was used
 * in declaring this this variable
 * 
 * **Related:** `isSymbolVariable`
 */
export function getVariableScope(sym: Symbol): TryVariableScope {
    for (const decl of sym.getDeclarations()) {
        if (Node.isVariableDeclaration(decl)) {
            const parent = decl.getParent();
            if (parent && Node.isVariableDeclarationList(parent)) {
                const kind = parent.getDeclarationKind();
                if (kind === VariableDeclarationKind.Var) return "var";
                if (kind === VariableDeclarationKind.Let) return "let";
                if (kind === VariableDeclarationKind.Const) return "const";
            }
        }
    }
    return false;
}
