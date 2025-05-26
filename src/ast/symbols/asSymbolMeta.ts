import { Symbol,  TypeChecker } from "ts-morph";
import { AstKind, KindSpecific, PackageJson,  SymbolMeta, SymbolMeta__Base } from "~/types";
import { 
    addSymbolsToCache,
    classExtends,
    createRefForSymbol,
    getAstKind,
    getClassMethods,
    getConstructor,
    getExternalSource, 
    getFunctionParameters, 
    getFunctionReturn, 
    getJsDocInfo, 
    getStaticMethods, 
    getSymbolFileDefinition, 
    getSymbolFlags, 
    getSymbolGenerics, 
    getSymbolScope,
    getType,
    getTypeChecker,
    getVariableScope,
    isTypeSymbol,
    isTypeUtilitySymbol,
    isVariableSymbol, 
} from "~/ast";
import { getExportType, isFunctionVariant, isFunctionMeta } from "~/type-guards";
import { isClassDefinition } from "~/ast/classes/isClassDefinition";
import { isAbstract } from "~/ast/classes/isAbstract";
import {  statSync } from "node:fs";
import {  Unexpected } from "~/errors";
import { isClassMeta } from "~/type-guards/isClassMeta";
import { isVariableMeta } from "~/type-guards/isVariableMeta";
import { displaySymbol } from "~/report";





/**
 * Converts a **ts-morph** `Symbol` into a `SymbolMeta`
 */
export function asSymbolMeta(
    sym: Symbol,
    opts: { checker?: TypeChecker } = {}
): SymbolMeta {
    const flags = getSymbolFlags(sym);
    const checker = opts.checker ? opts.checker : getTypeChecker(sym);

    const generics = getSymbolGenerics(sym);

    const isType: boolean = isTypeSymbol(sym);
    const isTypeUtility = isType && isTypeUtilitySymbol(sym, generics);
    const isClass = !isType && isClassDefinition(sym, {checker})
    const isVariable: boolean = !isType && isVariableSymbol(sym);

    const name = sym.getName();
    const fqn = sym.getFullyQualifiedName();
    const type = getType(sym);

    const scope = getSymbolScope(sym);
    const externalSource = (
        scope === "external"
        ? getExternalSource(sym) || {}
        : {} as PackageJson
    );

    const jsDocs = getJsDocInfo(sym);
    

    const {
        filepath,
        startLine,
        endLine
    } = getSymbolFileDefinition(sym);

    const exportType = getExportType(sym);

    const updated = statSync(filepath).ctimeMs as EpochTimeStamp;
    const astKind = getAstKind(sym, {exportType,scope});

    /**
     * Hash to be used for "freshness" testing
     */
    const timingHash = createRefForSymbol(sym,{
        astKind,
        filepath,
        scope,
        updated
    });

    /**
     * Hash intended to statically create a `1:1` map to a
     * `Symbol`.
     */
    const identityHash = createRefForSymbol(sym,{
        astKind,
        filepath,
        scope
    });
    const ref = createRefForSymbol(
            sym, {astKind,filepath,scope}
        );
    const hash = createRefForSymbol(
            sym, {astKind,filepath,scope,updated}
        )

 const base: SymbolMeta__Base = {
        __kind: "SymbolMeta",
        symbol: sym,
        astKind,
        ref,
        hash,
        scope,
        name,
        type,
        generics,
        exportType,
        fqn,
        flags,
        jsDocs,
        filepath,
        startLine,
        endLine,
        updated,

        getText: sym.getDeclarations()[0].getText,

        toJSON() {
            return JSON.stringify(this)
        },
        toConsole() {
            return displaySymbol(sym, {checker, format: "console"})
        },
        toString() {
            return displaySymbol(sym, {checker, format: "text"})
        },
    }

    if (isFunctionMeta(base)) {
        const fnVariant = isFunctionVariant(sym);
        if (!fnVariant) {
            throw Unexpected(`getFunctionVariant() was unable to determine what variant type the function was but the symbol HAS been determined to BE a function!`, )
        }


        const fn = {
            fnVariant,
            parameters: getFunctionParameters(sym, {fnVariant, checker}),
            returnType: getFunctionReturn(sym, {fnVariant, checker})
        } satisfies KindSpecific<"function">;

        return {
            ...base,
            ...fn
        } as SymbolMeta<"function">
    }


    if (isClassMeta(base)) {
        const classy = {
            extends: addSymbolsToCache(classExtends(sym)).map(i => i.ref),
            constructor: getConstructor(sym, {checker}),
            methods: getClassMethods(sym, {checker}),
            staticMethods: getStaticMethods(sym, {checker}),
            isAbstract: isAbstract(sym),
        } satisfies KindSpecific<"class">;

        return {
            ...base,
            ...classy
        } as SymbolMeta<"class">
    }

    if (isVariableMeta(base)) {
        const info = {
            varScope: getVariableScope(sym)
        }

        return {
            ...base,
            ...info
        } as SymbolMeta<"variable">
    }

    return base as SymbolMeta<"other">;
}


