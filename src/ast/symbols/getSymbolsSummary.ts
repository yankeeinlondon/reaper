import {  Symbol } from "ts-morph";
import { SymbolSummary } from "~/types";
import { getAstKind } from "../utils";
import { getSymbolScope } from "./getSymbolScope";


export function getSymbolsSummary(symbols: Symbol[]): SymbolSummary[] {
    const summary: SymbolSummary[] = [];

    for (const s of symbols) {

        const kind = getAstKind(s);
        const scope = getSymbolScope(s);
        const fqn = s.getFullyQualifiedName();

        summary.push({
            name: s.getName(),
            kind,
            scope,
            fqn
        })

    }

    return summary;
}
