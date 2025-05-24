import { asArray } from "inferred-types";
import { Symbol } from "ts-morph";
import { asSymbolsMeta } from "~/ast";
import { asSymbolMeta } from "~/ast/asSymbolMeta";
import { SYMBOL_LOOKUP, SYMBOLS } from "~/constants";
import { isSymbol } from "~/type-guards";
import { SymbolRef } from "~/types/reference-types";
import { SymbolMeta } from "~/types/SymbolMeta";

/**
 * takes one or more symbols and adds them to the `SYMBOLS`
 * cache as well as the `SYMBOL_LOOUP` map.
 * 
 * Returns all Symbols passed in as `SymbolMeta` regardless
 * of whether it was _already_ in the cache or was just added.
 */
export function addSymbolsToCache<T extends Symbol | Symbol[]>(
    sym: T
) {
    const metaInfo: SymbolMeta[] = [];
    for (const s of asArray(sym)) {
        if(!SYMBOLS.has(s)) {
            const meta = asSymbolMeta(s);
            metaInfo.push(meta);
            SYMBOLS.set(s, meta);
            SYMBOL_LOOKUP.set(meta.ref, s);
        } else {
            metaInfo.push(SYMBOLS.get(s) as SymbolMeta)
        }
    }

    return metaInfo;
}

/**
 * Get's a `Symbol` from a `SymbolRef` from cache (if it exists)
 */
export function getSymbol(ref: SymbolRef): Symbol | undefined {
    return SYMBOL_LOOKUP.has(ref) ? SYMBOL_LOOKUP.get(ref) : undefined;
}

/**
 * Will get a `SymbolRef` from either a `Symbol` or `SymbolRef` 
 * (if it exists in cache).
 */
export function getSymbolMeta(ref: SymbolRef | Symbol): SymbolMeta | undefined {
    return isSymbol(ref) && SYMBOLS.has(ref)
        ? SYMBOLS.get(ref)
        : isSymbolRef(ref)
        ? SYMBOL_LOOKUP.has()
}
