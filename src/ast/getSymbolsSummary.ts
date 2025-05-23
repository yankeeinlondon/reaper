import {  Symbol } from "ts-morph";
import { SymbolSummary } from "~/types";
import { createFullyQualifiedNameForSymbol, getSymbolKind, getSymbolScope } from "./asSymbolsMeta";

export function getSymbolsSummary(symbols: Symbol[]): SymbolSummary[] {
    const summary: SymbolSummary[] = [];

    for (const s of symbols) {

        const kind = getSymbolKind(s);
        const scope = getSymbolScope(s);
        const fqn = createFullyQualifiedNameForSymbol(s);

        summary.push({
            name: s.getName(),
            kind,
            scope,
            fqn
        })

    }

    return summary;
}
