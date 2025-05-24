import { Symbol } from "ts-morph";
import { 
    getExternalSource, 
    getSymbolFileDefinition, 
    getSymbolScope 
} from "~/ast";
import { FQN } from "~/types";

export const createFullyQualifiedNameForSymbol = (sym: Symbol) => {
    const name = sym.getName();
    const { filepath } = getSymbolFileDefinition(sym);
    const scope = getSymbolScope(sym);

    return (
        scope === "external"
            ? `ext::${String(getExternalSource(sym))}::${name}`
            : scope === "local"
                ? `local::${String(filepath)}::${name}`
                : `module::${sym.getFullyQualifiedName()}::${name}`
    ) as FQN
}


