import type { IsArray } from "inferred-types";
import type { Node, Symbol, TypeChecker } from "ts-morph";
import type { SymbolRef } from "~/types/reference-types";

import type { SymbolMeta } from "~/types/SymbolMeta";
import { asArray, isArray } from "inferred-types";
import { getTypeChecker } from "~/ast/utils/getTypeChecker";
import { SYMBOL_LOOKUP, SYMBOLS } from "~/constants";
import { isSymbol, isSymbolRef } from "~/type-guards";
import { addNode, hasNode, lookupNode } from "../nodes";
import { asSymbolMeta } from "./asSymbolMeta";

/**
 * takes one or more symbols and adds them to the `SYMBOLS`
 * cache as well as the `SYMBOL_LOOUP` map.
 *
 * Returns all Symbols passed in as `SymbolMeta` regardless
 * of whether it was _already_ in the cache or was just added.
 */
export function addSymbolsToCache<T extends Symbol | Symbol[]>(
    sym: T,
    opts: { checker?: TypeChecker } = {},
) {
    const metaInfo: SymbolMeta[] = [];
    const iterable = asArray(sym) as Symbol[];
    const checker = opts.checker ? opts.checker : getTypeChecker(iterable[0]);
    for (const s of iterable) {
        if (!SYMBOLS.has(s)) {
            const meta = asSymbolMeta(s, { checker });
            metaInfo.push(meta);
            SYMBOLS.set(s, meta);
            SYMBOL_LOOKUP.set(meta.ref, s);
        }
        else {
            metaInfo.push(SYMBOLS.get(s) as SymbolMeta);
        }
    }

    return (
        isArray(sym) ? metaInfo : metaInfo[0]
    ) as unknown as IsArray<T> extends true ? SymbolMeta[] : SymbolMeta;
}

/**
 * Get's a `Symbol` from either a `SymbolRef` or `Node`.
 *
 * - if passed in reference is a `Node` and it can be
 * converted into a `Symbol` via `getSymbol()` then it it will
 * be added to the `NODES` lookup as well as the symbol added
 * to the SYMBOLS cache.
 */
export function getSymbol(ref: SymbolRef | Node): Symbol | undefined {
    if (isSymbolRef(ref)) {
        return SYMBOL_LOOKUP.has(ref)
            ? SYMBOL_LOOKUP.get(ref)
            : undefined;
    }
    else if (hasNode(ref)) {
        return lookupNode(ref);
    }
    else {
        const sym = addNode(ref);
        if (sym) {
            addSymbolsToCache(sym);
            return sym;
        }
        else {
            return undefined;
        }
    }
}

/**
 * Will get a `SymbolRef` from either a `Symbol` or `SymbolRef`
 * (if it exists in cache).
 */
export function getSymbolMeta(ref: SymbolRef | Symbol): SymbolMeta | undefined {
    return isSymbol(ref) && SYMBOLS.has(ref)
        ? SYMBOLS.get(ref)
        : isSymbolRef(ref)
            ? SYMBOL_LOOKUP.has(ref)
                ? SYMBOLS.has(
                    SYMBOL_LOOKUP.get(ref) as unknown as Symbol,
                )
                    ? SYMBOLS.get(
                        SYMBOL_LOOKUP.get(ref) as unknown as Symbol,
                    )
                    : undefined
                : undefined
            : undefined;
}
