import { Symbol, SymbolFlags, TypeChecker } from "ts-morph";
import { AstKind, KindSpecific, PackageJson, SymbolFlagKey, SymbolMeta } from "~/types";
import { 
    createFullyQualifiedNameForSymbol,
    getExternalSource, 
    getSymbolFileDefinition, 
    getSymbolGenerics, 
    getSymbolScope, 
} from "~/ast";
import { getFunctionParameters } from "./functions/getFunctionParameters";
import { isExportedSymbol, isFunction } from "~/type-guards";
import { getFunctionReturn } from "./functions/getFunctionReturn";
import { isClassDefinition } from "~/types/isClass";
import { getConstructor } from "./classes/constructor";
import { getClassMethods } from "./classes/methods";
import { getStaticMethods } from "./classes/staticMethods";
import { isAbstract } from "~/ast/classes/isAbstract";
import { classExtends } from "./classes/classExtends";
import { addSymbolsToCache } from "~/utils";
import { EmptyObject } from "inferred-types";
import { getSymbolsJSDocInfo } from "./utils/getSymbolJsDocInfo";
import { getType } from "./utils/getType";
import {  statSync } from "node:fs";

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
    return reverseLookupEnum(SymbolFlags)(flag);
}

/**
 * Converts a **ts-morph** `Symbol` into a `SymbolMeta`
 */
export function asSymbolMeta(
    sym: Symbol,
    checker: TypeChecker
): SymbolMeta {
    const flags = getSymbolFlags(sym);

    const isTypeSymbol: boolean = flags.includes("Type")
        || flags.includes("TypeAlias")
        || flags.includes("TypeLiteral")
        || flags.includes("Interface");

    const isVariable: boolean = flags.includes("Variable")
        || flags.includes("BlockScopedVariable")
        || flags.includes("ConstEnum");

    const name = sym.getName();
    const type = getType(sym);
    const fqn = createFullyQualifiedNameForSymbol(sym);


    const generics = getSymbolGenerics(sym);
    const scope = getSymbolScope(sym);
    const externalSource = (
        scope === "external"
        ? getExternalSource(sym) || {}
        : {} as PackageJson
    );

    const jsDocs = getSymbolsJSDocInfo(sym);
    const fnType = isFunction(sym);

    const {
        filepath,
        startLine,
        endLine
    } = getSymbolFileDefinition(sym);

    const functionProps: EmptyObject | KindSpecific<"function"> = fnType
        ? {
            fnType,
            generics,
            parameters: getFunctionParameters(sym, {fnType, checker}),
            returnType: getFunctionReturn(sym, {fnType, checker})
        } satisfies KindSpecific<"function">
        : {};

    const classProps: EmptyObject | KindSpecific<"class"> = !fnType && isClassDefinition(sym)
        ? {
            extends: addSymbolsToCache(classExtends(sym)).map(i => i.fqn),
            constructor: getConstructor(sym, {checker}),
            methods: getClassMethods(sym, {checker}),
            staticMethods: getStaticMethods(sym, {checker}),
            generics: getSymbolGenerics(sym),
            isAbstract: isAbstract(sym),
        } satisfies KindSpecific<"class">
        : {};

    const typeUtilityProps: KindSpecific<"type"> | EmptyObject = isTypeSymbol && generics.length > 0
    ? {
        generics
    }
    : {};

    const isExported = isExportedSymbol(sym);

    const updated = statSync(filepath).ctimeMs as EpochTimeStamp;
    const astKind: AstKind = isExported === "re-exported"
    ? "re-export"
    : fnType 
    ? "function"
    : !fnType && isClassDefinition(sym)
        ? "class"
    : isTypeSymbol
        ? generics.length === 0 ? "type" : "type-utility"
    : isVariable
        ? "variable"
    : "other";


    return {
        __kind: "SymbolMeta",
        symbol: sym,
        astKind,
        scope,
        name,
        type,
        isExported,
        fqn,
        flags,
        externalSource,
        jsDocs,
        filepath,
        startLine,
        endLine,
        ...functionProps,
        ...classProps,
        ...typeUtilityProps,
        updated,

        getText: sym.getDeclarations()[0].getText,

        toJSON() {
            return JSON.stringify(this)
        },
        toConsole() {
            return ``
        },
        toString() {
            return ``
        },
    }

}


