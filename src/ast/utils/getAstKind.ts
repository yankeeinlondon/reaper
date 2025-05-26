import { Symbol } from "ts-morph";
import { getExportType } from "~/type-guards";
import { ExportType, SymbolScope } from "~/types";
import { isClassDefinition } from "~/ast/classes/isClassDefinition";
import { isTypeSymbol, isTypeUtilitySymbol } from "./isTypeSymbol";
import { isVariableSymbol } from "./isVariableSymbol";
import { getSymbolScope } from "../symbols";

type AstKindOpt = {
    exportType?: ExportType;
    scope?: SymbolScope;
}

/**
 * Determines which `AstKind` the passed in `Symbol` should be 
 * assigned to.
 */
export function getAstKind(
    sym: Symbol, 
    opt: AstKindOpt = {}
) {
    const exportType = opt.exportType || getExportType(sym);
    const scope = opt.scope || getSymbolScope(sym);
    const isType =  isTypeSymbol(sym);
    const isTypeUtility = isType && isTypeUtilitySymbol(sym);
    const isClass = !isType && isClassDefinition(sym);
    const isVariable = !isType && isVariableSymbol(sym);

    return exportType === "re-exported"
        ? "re-export"
        : isType
            ? isTypeUtility ? "type-utility" : "type"
        : isVariable
            ? "variable"
        : "other";
}
