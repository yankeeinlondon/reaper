import type { Symbol } from "ts-morph";
import { ts } from "ts-morph";
import type { SymbolFlagKey } from "~/types";

function reverseLookupEnum(enumObj: object) {
    return (value: number): SymbolFlagKey[] => {
        return Object.entries(enumObj)
            .filter(([_key, val]) => typeof val === "number" && (value & (val as number)) !== 0)
            .map(([key]) => key as SymbolFlagKey) || [`unknown(${value})` as SymbolFlagKey];
    };
}

/**
 * **getSymbolFlags**`(sym)`
 *
 * Every symbol has a "flag" identifier which is provided by
 * the intersection of numeric `SymbolFlags`. The integer value which you
 * would typically get back is a bit hard to work with so
 * this function instead provides the enumeration _key_ on
 * `ts.SymbolFlags` which is far more contextual.
 */
export function getSymbolFlags<T extends Symbol>(sym: T): SymbolFlagKey[] {
    const flag = sym.getFlags();
    return reverseLookupEnum(ts.SymbolFlags)(flag);
}
