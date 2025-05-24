import { Symbol, TypeChecker } from "ts-morph";
import { FnType } from "~/types";

export type IsFunction = false | FnType;

/**
 * Tests whether the given symbol is a _function_ of some
 * type and returns the `FnType` if it is, otherwise returns `false`.
 */
export function isFunction(
    sym: Symbol
): IsFunction {
    for (const d of sym.getDeclarations()) {
        // Named function: function foo() {}
        if (d.getKindName() === "FunctionDeclaration") {
            return "named-fn";
        }
        // Arrow function or function expression assigned to a variable
        if (d.getKindName() === "VariableDeclaration") {
            const init = (d as any).getInitializer?.();
            if (init) {
                if (init.getKindName() === "ArrowFunction") {
                    return "arrow-fn";
                }
                if (init.getKindName() === "FunctionExpression") {
                    return "named-fn";
                }
            }
            // Intersection type: ((...) => ...) & { ... }
            const type = (d as any).getType?.();
            if (type && type.isIntersection && type.isIntersection()) {
                const parts = type.getIntersectionTypes();
                const hasCall = parts.some((t: any) => t.getCallSignatures().length > 0);
                const hasProps = parts.some((t: any) => t.getProperties().length > 0);
                if (hasCall && hasProps) {
                    return "fn-intersection";
                }
            }
        }
        // Type alias for intersection function
        if (d.getKindName() === "TypeAliasDeclaration") {
            const type = (d as any).getType?.();
            if (type && type.isIntersection && type.isIntersection()) {
                const parts = type.getIntersectionTypes();
                const hasCall = parts.some((t: any) => t.getCallSignatures().length > 0);
                const hasProps = parts.some((t: any) => t.getProperties().length > 0);
                if (hasCall && hasProps) {
                    return "fn-intersection";
                }
            }
        }
    }
    return false;
}
