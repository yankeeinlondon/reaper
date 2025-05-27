import type { Symbol, ts } from "ts-morph";

/**
 * Boolean check as to whether the given Symbol has _at least_
 * one of the passed in flags.
 */
export function hasSomeSymbolFlags(symbol: Symbol, ...find: ts.SymbolFlags[]) {
    const flags = symbol.getFlags();
    return find.some(f => (flags & f) == f);
}
