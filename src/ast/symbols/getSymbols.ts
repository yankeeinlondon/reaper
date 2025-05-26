import { SourceFile, Symbol } from "ts-morph";
import { getSymbolScope } from "./getSymbolScope";


/**
 * Gets all of the symbols across a project's files
 */
export function getSymbols(files: SourceFile[]) {
    const have: string[] = [];

    const symbols = files.flatMap(s => {
        const fileSymbols: Symbol[] = []
        s.forEachDescendant(node => {
            const symbol = node.getSymbol();
            if (symbol) {
                const scope = getSymbolScope(symbol);
                const name = symbol.getName();
                if( !have.includes(name)) {
                    fileSymbols.push(symbol as Symbol);
                    have.push(name);
                }
            }
        });
        return fileSymbols;
    }) as unknown as Symbol[];

    return symbols;
}
