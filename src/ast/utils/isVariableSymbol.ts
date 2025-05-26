import { Symbol } from "ts-morph";
import { getSymbolFlags } from "./getSymbolFlags";

/**
 * Looks at the `tags` on a `Symbol` to determine if
 * the symbol is a **variable**.
 */
export function isVariableSymbol(sym: Symbol): boolean {
    const flags = getSymbolFlags(sym);

    return flags.includes("Variable")
        || flags.includes("BlockScopedVariable")
        || flags.includes("ConstEnum");
}

