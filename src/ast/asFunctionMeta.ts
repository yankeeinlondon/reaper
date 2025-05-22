import { Symbol, Project } from "ts-morph";
import {
    getSymbolKind,
    getSymbolFlags,
    getSymbolScope,
    getSymbolFileDefinition,
    getExternalSource,
    getSymbolsJSDocInfo,
    getSymbolGenerics,
    createFullyQualifiedNameForSymbol
} from "./symbols";
import { JsDocInfo } from "~/types/symbol-ast-types";
import { FunctionMeta, FunctionParameter, FunctionReturn } from "~/types/FunctionMeta";
import { SymbolScope } from "~/types/general";
import { statSync } from "fs";
import path from "path";
import { NotFunction } from "~/errors";

/**
 * **asFunctionMeta**`(sym, project) -> FunctionMeta`
 * 
 * Converts a **ts-morph** `Symbol` into a serializable representation 
 * defined by `FunctionMeta`.
 * 
 * **Note:** in cases where the Symbol passed in _is not_ a function
 * then it will instead throw the `NotFunction` error type.
 */
export function asFunctionMeta<S extends SymbolScope = SymbolScope>(
    sym: Symbol,
    project: Project
): FunctionMeta<S> {
    // Check if symbol is a function (named, arrow, or intersection)
    const kind = getSymbolKind(sym);
    if (kind !== "function" && kind !== "const-function" && kind !== "other") {
        throw NotFunction("Symbol is not a function");
    }

    // Get the first declaration (should be function-like)
    const decl = sym.getDeclarations()[0];
    if (!decl) {
        throw NotFunction("Symbol has no declaration");
    }

    // Get type checker
    const checker = project.getTypeChecker();
    const type = checker.getTypeOfSymbolAtLocation(sym, decl);
    const signatures = type.getCallSignatures();
    const signature = signatures[0];

    // Parameters
    const parameters: FunctionParameter[] = signature
        ? signature.getParameters().map(paramSym => {
            const paramDecl = paramSym.getDeclarations()[0];
            const paramType = checker.getTypeOfSymbolAtLocation(paramSym, paramDecl ?? decl);
            const jsDocs: JsDocInfo[] = paramDecl ? getSymbolsJSDocInfo(paramSym) : [];
            return {
                name: paramSym.getName(),
                type: checker.getTypeText(paramType),
                optional: !!(paramDecl && (paramDecl as any).isOptional && (paramDecl as any).isOptional()),
                defaultValue: paramDecl && (paramDecl as any).getInitializer ? (paramDecl as any).getInitializer()?.getText() : undefined,
                jsDocs
            };
        })
        : [];

    // Return type
    const returnType: FunctionReturn = signature
        ? {
            type: checker.getTypeText(signature.getReturnType()),
            jsDocs: [] // Could extract from JSDoc @returns if needed
        }
        : { type: "void" };

    // File info
    const { filepath, startLine, endLine } = getSymbolFileDefinition(sym);
    let updated = Date.now();
    try {
        if (filepath) {
            const stat = statSync(path.resolve(process.cwd(), filepath));
            updated = stat.mtimeMs;
        }
    } catch {}

    // Scope and external source
    const scope = getSymbolScope(sym) as S;
    const externalSource = scope === "external" ? getExternalSource(sym) : undefined;

    // Compose meta
    return {
        name: sym.getName(),
        fqn: createFullyQualifiedNameForSymbol(sym),
        scope,
        externalSource: (scope === "external" ? externalSource : undefined) as FunctionMeta<S>["externalSource"],
        filepath,
        startLine,
        endLine,
        flags: getSymbolFlags(sym),
        generics: getSymbolGenerics(sym),
        parameters,
        returnType,
        jsDocs: getSymbolsJSDocInfo(sym),
        updated
    };
}
