import { Symbol } from "ts-morph";

/**
 * Tests whether the passed in symbol is external to the repo
 * being evaluated.
 */
export function isExternalSymbol(sym: Symbol): boolean {
    return sym.getName() === sym.getFullyQualifiedName();
}
