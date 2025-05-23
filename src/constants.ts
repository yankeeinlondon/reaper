import findRoot from "find-root";
import { cwd } from "process";
import { Symbol } from "ts-morph";
import { SymbolMeta } from "./types/SymbolMeta";
import { SymbolRef } from "./types/reference-types";


export const CWD = cwd();
export const ROOT = findRoot(CWD);

/**
 * A cache of all the `Symbol`'s analyzed so far during
 * the lifespan of the API, mapped to a `SymbolMeta` 
 * representation for quick access to key features of
 * the symbol.
 */
export const SYMBOLS = new WeakMap<Symbol, SymbolMeta>;

/**
 * Allows for the lookup of a `Symbol` based on a `SymbolRef`
 */
export const SYMBOL_LOOKUP = new Map<SymbolRef, Symbol>;
