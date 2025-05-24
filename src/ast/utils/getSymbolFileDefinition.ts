import { relative } from "path";
import { cwd } from "process";
import { Symbol } from "ts-morph";

export const getSymbolFileDefinition = (sym: Symbol): {
    filepath: string;
    startLine: number;
    endLine: number;
} => {
    // Try to get the first declaration of the symbol
    const decl = sym.getDeclarations()[0];

    if (!decl) {
        // If no declarations are found, return undefined values
        return {
            filepath: "",
            startLine: -1,
            endLine: -1
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
        endLine
    };
};
