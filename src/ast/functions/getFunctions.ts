import type {
    SourceFile,
    Symbol,
    TypeChecker,
} from "ts-morph";
import type { FnVariant } from "~/types/general";
import {
    Node,
    SymbolFlags,
} from "ts-morph";

/**
 * Get's all the functions defined in the source files provided.
 *
 * - you can optionally use the `types` property to narrow down to
 * just certain _types_ of functions but by default it will find
 * all types.
 */
export function getFunctions<T extends readonly FnVariant[]>(
    sourceFiles: SourceFile[],
    checker: TypeChecker,
    ...types: T
): Symbol[] {
    const scope: Symbol[] = [];
    const unique = Array.from(new Set<FnVariant>(types));

    if (unique.length === 1 && unique[0] === "named-fn") {
    // in this case we ONLY need SymbolFlags.Function
    // to do our filtering

        for (const file of sourceFiles) {
            const symbols = checker.getSymbolsInScope(
                file,
                SymbolFlags.Function,
            );

            scope.push(...symbols);
        }
    }
    else {
    // in all other cases at least one type we're looking
    // for requires SymbolFlags.Variable and we need to
    // do some additional work on the filtering

        for (const file of sourceFiles) {
            const symbols = checker.getSymbolsInScope(
                file,
                SymbolFlags.Function | SymbolFlags.Variable,
            ).filter(
                s => s.getDeclarations().some(
                    (d) => {
                        if (!Node.isVariableDeclaration(d))
                            return false;

                        const init = d.getInitializer();
                        if (
                            Node.isArrowFunction(init)
              || Node.isFunctionExpression(init)
                        ) {
                            return true;
                        }
                        else {
                            const type = d.getType();
                            if (!type.isIntersection()) {
                                return false;
                            }
                            const parts = type.getIntersectionTypes();

                            const hasCall = parts.some(
                                t => t.getCallSignatures().length > 0,
                            );

                            const hasProps = parts.some(
                                t => t.getProperties().length > 0,
                            );

                            return hasCall && hasProps;
                        }
                    },
                ),
            );

            scope.push(...symbols);
        }
    }

    return scope;
}
