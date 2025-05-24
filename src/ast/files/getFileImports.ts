import { SourceFile } from "ts-morph";
import { SymbolImport } from "~/types";


export const getFileImports = (file: SourceFile): SymbolImport[] => {
    const importDeclarations = file.getImportDeclarations();
    const imported: SymbolImport[] = [];

    importDeclarations.map(iDecl => {

        // named imports
        iDecl.getNamedImports().map(namedImport => {
            const symbol = namedImport.getSymbol();
            const alias = namedImport.getAliasNode()?.getText() || namedImport.getName();
            if (symbol) {
                imported.push(
                    {
                        symbol: asSymbolReference(symbol),
                        as: alias,
                        source: iDecl.getModuleSpecifierValue(),
                        exportKind: "named",
                        isExternalSource: determineIfExternal(iDecl.getModuleSpecifierValue())
                    } as SymbolImport
                );
            }
        });

        // default import
        if (iDecl.getDefaultImport()) {
            const defaultSymbol = iDecl.getDefaultImport()?.getSymbol();
            const alias = iDecl.getDefaultImport()?.getText();
            if (defaultSymbol && alias) {
                imported.push({
                    symbol: asSymbolReference(defaultSymbol),
                    as: alias,
                    source: iDecl.getModuleSpecifierValue(),
                    exportKind: "default",
                    isExternalSource: determineIfExternal(iDecl.getModuleSpecifierValue())
                });
            }
        }

    });

    return imported;
}
