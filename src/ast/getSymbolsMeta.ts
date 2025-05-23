import { Symbol } from "ts-morph";
import { asSymbolsMeta } from "./asSymbolsMeta";
import { SymbolsMeta } from "~/types";

/**
 * converts an array of **ts-morph** `Symbol`'s to
 * the `SymbolMeta` format.
 */
export function getSymbolsMeta(
    ast: Symbol[]
): SymbolsMeta[] {
    return ast.map(i => asSymbolsMeta(i))
}
