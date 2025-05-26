import { Symbol, TypeChecker } from "ts-morph";
import { FunctionParameter, FnVariant } from "~/types";
import {  } from "~/types";
import { isFunctionVariant } from "~/type-guards";

export function getFunctionParameters(
    sym: Symbol,
    options?: { fnVariant?: FnVariant | false; checker?: TypeChecker }
): FunctionParameter[] {
    const type = options?.fnVariant || isFunctionVariant(sym);
    const decl = sym.getDeclarations()[0];
    if (!decl) return [];
    const checker = options?.checker;

    // Helper to extract parameters from a callable signature
    function extractParams(signature: any): FunctionParameter[] {
        return signature.getParameters().map((paramSym: any) => {
            const paramDecl = paramSym.getDeclarations()[0];
            const paramType = checker && paramDecl ? checker.getTypeOfSymbolAtLocation(paramSym, paramDecl) : undefined;
            return {
                name: paramSym.getName(),
                type: paramType ? checker ? checker.getTypeText(paramType) : "unknown" : "unknown",
                optional: !!(paramDecl && (paramDecl as any).isOptional && (paramDecl as any).isOptional()),
                defaultValue: paramDecl && (paramDecl as any).getInitializer ? (paramDecl as any).getInitializer()?.getText() : undefined,
                jsDocs: []
            };
        });
    }

    // Named or arrow function
    if (type === "named-fn" || type === "arrow-fn") {
        const effectiveChecker = checker || decl.getSourceFile().getProject().getTypeChecker();
        const tsType = effectiveChecker.getTypeOfSymbolAtLocation(sym, decl);
        const signatures = tsType.getCallSignatures();
        if (signatures.length > 0) {
            return extractParams(signatures[0]);
        }
    }

    // Intersection function: find the callable part
    if (type === "fn-intersection") {
        const effectiveChecker = checker || decl.getSourceFile().getProject().getTypeChecker();
        const tsType = effectiveChecker.getTypeOfSymbolAtLocation(sym, decl);
        if (tsType.isIntersection && tsType.isIntersection()) {
            const parts = tsType.getIntersectionTypes();
            const callable = parts.find((t: any) => t.getCallSignatures().length > 0);
            if (callable) {
                return extractParams(callable.getCallSignatures()[0]);
            }
        }
    }

    return [];
}
