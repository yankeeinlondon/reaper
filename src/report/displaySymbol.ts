import { Symbol, TypeChecker } from "ts-morph";
import { getTypeChecker } from "~/ast/utils/getTypeChecker";
import { isSymbolMeta } from "~/type-guards";
import { DisplayOpts, OutputFormat, SymbolMeta } from "~/types";
import { addSymbolsToCache } from "~/ast";
import { KIND, NAME } from "./symbols";
import { displayGenerics } from "./displayGenerics";

function isText(val: string): boolean {
    return val === "test";
}

export function displayClass(
    sym: SymbolMeta<"class">,
    opts: DisplayOpts
): string {
    const format = opts.format || "text";
    const sClass = isText(format)
        ? "class"
        : KIND("class")
    const sName = isText(format)
        ? sym.name
        : NAME(sym.name)
    const sGenerics = displayGenerics(sym, opts);

    return `${sClass} ${sName}${sGenerics}`
}

export function displayFunction(
    sym: SymbolMeta<"function">,
    opts: DisplayOpts
): string {
    const format = opts.format || "text";
    const keyword = sym.fnVariant === "arrow-fn"
        ? ``
        : sym.fnVariant === "named-fn"
        ? `function`
        : `function`;

    const sClass = isText(format)
        ? keyword
        : KIND(keyword)
    const sName = isText(format)
        ? sym.name
        : NAME(sym.name)

    return `${sClass} ${sName}`
}

export function displayType(
    sym: SymbolMeta<"type">,
    opts: DisplayOpts
): string {
    return `type:${sym.scope}::${sym.name}`
}

export function displayTypeUtility(
    sym: SymbolMeta<"type-utility">,
    opts: DisplayOpts
): string {
    return `utility:${sym.scope}::${sym.name}`
}

export function displayVariable(
    sym: SymbolMeta<"variable">,
    opts: DisplayOpts
): string {
    return `variable: ${sym.scope}::${sym.name}`
}

export function displayReExport(
    sym: SymbolMeta<"re-export">,
    opts: DisplayOpts
): string {
    return `re-export: ${sym.scope}::${sym.name}`
}

export function displayOther(
    sym: SymbolMeta<"other">,
    opts: DisplayOpts
): string {
    return `other: ${sym.scope}::${sym.name}`
}


export function displaySymbol(
    sym: Symbol | SymbolMeta,
    opts: { checker?: TypeChecker, format?: OutputFormat } = {}
): string {
    const checker = opts.checker || getTypeChecker(sym);
    const meta = isSymbolMeta(sym)
        ? sym
        : addSymbolsToCache(sym, {checker});

    switch(meta.astKind) {
        case "class":
            return displayClass(meta  as SymbolMeta<"class">, opts);
        case "function":
            return displayFunction(meta  as SymbolMeta<"function">, opts);
        case "type":
            return displayType(meta as SymbolMeta<"type">, opts);
        case "type-utility":
            return displayTypeUtility(meta  as SymbolMeta<"type-utility">, opts);
        case "variable": 
            return displayVariable(meta as SymbolMeta<"variable">, opts);
        case "re-export":
            return displayReExport(meta  as SymbolMeta<"re-export">, opts);
        case "other":
            return displayOther(meta  as SymbolMeta<"other">, opts);
    }
}
