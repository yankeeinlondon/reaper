import { SourceFile, TypeChecker } from "ts-morph";
import { SymbolImport } from "~/types";


export const getFileImports = (
    file: SourceFile,
    opts: { checker?: TypeChecker } = {}
): SymbolImport[] => {
    const importDeclarations = file.getImportDeclarations();
    const imported: FileImportMeta[] = [];

    // TODO

    return imported;
}
