import type { Symbol } from "ts-morph";
import { relative } from "node:path";
import { cwd } from "node:process";

/**
 * Returns a `filepath`, `startLine`, and `endLine` for the passed
 * in **ts-morph** `Symbol`.
 */
export function getSymbolFileDefinition(sym: Symbol): {
    filepath: string;
    startLine: number;
    endLine: number;
} {
    // Try to get the first declaration of the symbol
    const decl = sym.getDeclarations()[0];

    if (!decl) {
    // If no declarations are found, return undefined values
        return {
            filepath: "",
            startLine: -1,
            endLine: -1,
        };
    }

    // Get the source file from the declaration
    const sourceFile = decl.getSourceFile();
    const filepath = relative(cwd(), sourceFile.getFilePath());
    const startLine = decl.getStartLineNumber();
    const endLine = decl.getEndLineNumber();

    return {
        filepath,
        startLine,
        endLine,
    };
}
