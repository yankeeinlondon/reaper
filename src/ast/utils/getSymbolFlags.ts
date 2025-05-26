import { Symbol } from "ts-morph";
import { SymbolFlagKey } from "~/types";

const reverseLookupEnum = (enumObj: object) => (value: number): SymbolFlagKey[] => {
    return Object.entries(enumObj)
        .filter(([_key, val]) => typeof val === "number" && (value & val) === val)
        .map(([key]) => key as SymbolFlagKey) || `unknown(${value})`;
};

/**
 * **getSymbolFlags**`(sym)`
 * 
 * Every symbol has a "flag" identifier which is provided by 
 * the intersection of numeric `SymbolFlags`. The integer value which you
 * would typically get back is a bit hard to work with so 
 * this function instead provides the enumeration _key_ on
 * `ts.SymbolFlags` which is far more contextual.
 */
export const getSymbolFlags = <T extends Symbol>(
    sym: T,
): SymbolFlagKey[] => {
    const flag = sym.getFlags();
    return reverseLookupEnum(sym)(flag);
}

