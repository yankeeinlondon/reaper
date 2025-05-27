import type { Symbol } from "ts-morph";
import type { SymbolMeta } from "~/types";
import { addSymbolsToCache } from "~/ast";

/**
 * converts an array of **ts-morph** `Symbol`'s to
 * the `SymbolMeta` format.
 *
 * **Note:** this is now just an alias for calling `addSymbolsToCache()`
 * but it's name may feel more semantec so keeping for now.
 */
export function getSymbolsMeta(
    ast: Symbol[],
): SymbolMeta[] {
    return addSymbolsToCache(ast);
}
