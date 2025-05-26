import { cwd } from "process";
import {  Symbol } from "ts-morph";
import { SymbolMeta } from "./types/SymbolMeta";
import { SymbolRef } from "./types/reference-types";
import { isNumberLike } from "inferred-types";
import { repoRoot } from "./utils";

export const CWD = cwd();
/**
 * the closest repository root folder based on the
 * current working directory.
 */
export const getRoot = () => repoRoot(CWD);

/**
 * A cache of all the `Symbol`'s analyzed so far during
 * the lifespan of the API, mapped to a `SymbolMeta` 
 * representation for quick access to key features of
 * the symbol.
 */
export const SYMBOLS = new WeakMap<Symbol, SymbolMeta>;

/**
 * Allows for the lookup of a `Symbol` with a `SymbolRef`
 */
export const SYMBOL_LOOKUP = new Map<SymbolRef, Symbol>;


export const SYMBOL_REF_PREFIXES = [
    "function",
    "class",
    "type",
    "type-utility",
    "variable",
    "re-export",
    "other"
] as const;



export const FILE_REF_PREFIX = "file-ref::" as const;
export const DIAG_REF_PREFIX = "diag::" as const;

export const MAX_CONCURRENT_PROCESSES = isNumberLike(process.env.MAX_CONCURRENT_PROCESSES)
? Number(process.env.MAX_CONCURRENT_PROCESSES)
: 6;

