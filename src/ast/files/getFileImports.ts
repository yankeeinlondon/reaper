import type { SourceFile, TypeChecker } from "ts-morph";
import type { SymbolImport } from "~/types";

export function getFileImports(file: SourceFile, opts: { checker?: TypeChecker } = {}): SymbolImport[] {
    const importDeclarations = file.getImportDeclarations();
    const imported: FileImportMeta[] = [];

    // TODO

    return imported;
}
