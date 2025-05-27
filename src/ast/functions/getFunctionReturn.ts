import type { Symbol, TypeChecker } from "ts-morph";
import type { FnVariant, FunctionReturn } from "~/types";
import { isFunctionVariant } from "~/type-guards";

export function getFunctionReturn(
    sym: Symbol,
    options?: { fnVariant?: FnVariant | false; checker?: TypeChecker },
): FunctionReturn {
    const type = options?.fnVariant || isFunctionVariant(sym);
    const decl = sym.getDeclarations()[0];
    if (!decl)
        return { type: "unknown" };
    const checker = options?.checker;

    // Helper to extract return type from a callable signature
    function extractReturn(signature: any): FunctionReturn {
        const effectiveChecker = checker || decl.getSourceFile().getProject().getTypeChecker();
        return {
            type: effectiveChecker.getTypeText(signature.getReturnType()),
            jsDocs: [],
        };
    }

    // Named or arrow function
    if (type === "named-fn" || type === "arrow-fn") {
        const effectiveChecker = checker || decl.getSourceFile().getProject().getTypeChecker();
        const tsType = effectiveChecker.getTypeOfSymbolAtLocation(sym, decl);
        const signatures = tsType.getCallSignatures();
        if (signatures.length > 0) {
            return extractReturn(signatures[0]);
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
                return extractReturn(callable.getCallSignatures()[0]);
            }
        }
    }

    return { type: "unknown" };
}
