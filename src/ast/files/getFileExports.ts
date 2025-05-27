import type { SourceFile, TypeChecker, Symbol } from "ts-morph";


function getRuntimeFileExports(
    file: SourceFile,
    checker?: TypeChecker
): Symbol[] {
    // Get all exported symbols from the file
    const exports = file.getExportSymbols();
    // Filter to only runtime exports (not type-only)
    return exports.filter(sym => {
        const declarations = sym.getDeclarations();
        // If any declaration is a type-only export, skip
        return declarations.some(decl => {
            const kind = decl.getKindName();
            // EnumDeclaration is a runtime construct
            return ![
                "TypeAliasDeclaration",
                "InterfaceDeclaration",
                "TypeParameter",
                "TypeLiteral"
            ].includes(kind);
        });
    });
}

function getTypeFileExports(
    file: SourceFile,
    checker?: TypeChecker
): Symbol[] {
    // Get all exported symbols from the file
    const exports = file.getExportSymbols();
    // Filter to only type exports (type-only)
    return exports.filter(sym => {
        const declarations = sym.getDeclarations();
        // If any declaration is a type-only export, include
        return declarations.some(decl => {
            const kind = decl.getKindName();
            return [
                "TypeAliasDeclaration",
                "InterfaceDeclaration",
                "TypeParameter",
                "TypeLiteral"
            ].includes(kind);
        });
    });
}

export type GetFileExports__Scope = "runtime" | "types" | "both";


/**
 * Get's the passed in file's defined **exports**.
 * 
 * - the user must choose whether the "scope" of these exports:
 * 
 *     - **runtime**: _just variables, class definitions, and functions_
 *     - **types**: _all exported types including "type utilities"_
 *     - **both**: _all runtime and type based symbols_
 */
export function getFileExports<S extends GetFileExports__Scope>(
    file: SourceFile,
    scope: S,
    opts: { checker?: TypeChecker }
): S extends "both"
    ? {
        runtime: Symbol[],
        types: Symbol[]
    }
    : Symbol[] {

    let result;

    switch(scope) {
        case "runtime":
            result = getRuntimeFileExports(file, opts.checker);
            break;
        case "types":
            result = getTypeFileExports(file, opts.checker);
            break;
        case "both": 
            result = {
                runtime: getRuntimeFileExports(file, opts.checker),
                types: getTypeFileExports(file, opts.checker)
            };
            break;
    }

    return result as S extends "both"
    ? {
        runtime: Symbol[],
        types: Symbol[]
    }
    : Symbol[]

}
