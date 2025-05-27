import type { Symbol } from "ts-morph";
import type { AstKind, SymbolScope } from "~/types";
import type { SymbolRef } from "~/types/reference-types";
import {
    getAstKind,
    getSymbolFileDefinition,
    getSymbolScope,
} from "~/ast";
import { md5 } from "~/utils";

interface RefOptions {
    /** provide the `AstKind` if you have it */
    astKind?: AstKind;
    /** provide the `SymbolScope` if you have it */
    scope?: SymbolScope;

    /** the filepath to the `Symbol` */
    filepath?: string;

    /**
     * provide a timestamp if you want the reference to be
     * sensitive to variations in the file's last changed date.
     */
    updated?: EpochTimeStamp;
}

/**
 * Creates a string-based _reference_ to a `Symbol` which
 * ensures uniqueness and a `1:1` mapping while retaining
 * some semantic meaning for debugging benefit.
 *
 * - Format is `${AstKind}::${SymbolScope}::${Name}${string}`
 * - Where:
 *     - first two components are defined by `AstKind`, `SymbolScope`
 *     - `Name` is the name provided by `symbol.getName()`
 *     - the final component is an MD5 hash
 *          - if `updated` is populated in the options then
 *          it will combine the symbol's `fullyQualifiedName()`
 *          with `updated` timestamp to create a time dependent
 *          hash.
 *          - if `updated` is not found then only the fully qualified
 *          name will be used for the hash.
 *
 * You may use this function if you like but it's primary intent
 * is to be used by the caching mechanism which this repo provides.
 */
export function createRefForSymbol(sym: Symbol, opt: RefOptions): SymbolRef {
    const name = sym.getName();
    const scope = opt.scope || getSymbolScope(sym);
    const fqn = sym.getFullyQualifiedName();
    const astKind: AstKind = opt.astKind || getAstKind(sym, opt);
    const filepath = opt.filepath || getSymbolFileDefinition(sym).filepath;
    const updated = opt.updated || "";

    const hash = md5(`${fqn}::${updated}`);

    return `${astKind}::${scope}::${filepath}::${hash}`;
}
