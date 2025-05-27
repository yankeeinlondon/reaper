import type { Symbol, Type } from "ts-morph";
import type { SymbolType } from "~/types";

// Overload signatures
export function getType(sym: Symbol): SymbolType;
export function getType(type: Type): SymbolType;

/**
 * Takes a `Symbol` or `Type` and returns a robust
 * type description of type `SymbolType`.
 */
export function getType(input: Symbol | Type): SymbolType {
    // If input is a Symbol, get its declared type
    const dt = ("getDeclaredType" in input)
        ? input.getDeclaredType()
        : input;
    if (dt.isUnion && dt.isUnion()) {
        const parts = dt.getUnionTypes().map(i => getType(i));
        return {
            kind: "union",
            type: dt.compilerType,
            text: dt.getText(),
            isLiteral: dt.isLiteral(),
            isContainer: dt.isArray() || dt.isObject(),
            isReadonlyArray: dt.isReadonlyArray(),
            parts,
            literalValue: parts.map(p => p.literalValue).filter(v => v !== undefined && v !== null),
        };
    }
    else if (dt.isIntersection && dt.isIntersection()) {
        const parts = dt.getIntersectionTypes().map(i => getType(i));
        return {
            kind: "intersection",
            type: dt.compilerType,
            text: dt.getText(),
            isLiteral: dt.isLiteral(),
            isContainer: dt.isArray() || dt.isObject(),
            isReadonlyArray: dt.isReadonlyArray(),
            parts,
            literalValue: parts.map(p => p.literalValue).filter(v => v !== undefined && v !== null),
        };
    }
    else {
        const isLiteral = dt.isLiteral();
        let literalValue: any;
        if (isLiteral && typeof dt.getLiteralValue === "function") {
            literalValue = dt.getLiteralValue();
        }
        return {
            kind: "type",
            type: dt.compilerType,
            isLiteral,
            isContainer: dt.isArray() || dt.isObject(),
            isReadonlyArray: dt.isReadonlyArray(),
            text: dt.getText(),
            literalValue,
        };
    }
}
