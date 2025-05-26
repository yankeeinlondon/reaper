import { Symbol } from "ts-morph";
import { getVariableScope } from "./getVariableScope";
import { InvalidSymbol } from "~/errors";

/**
 * Extracts key metadata from a **ts-morph** `Symbol` which is
 * a **variable** type. 
 * 
 * - non-variables symbols passed in will result in a `InvalidSymbol`
 * error being thrown
 */
export function getVariableMeta(
    sym: Symbol
) {
    const scope = getVariableScope(sym);

    if(!scope) {
        throw InvalidSymbol(`A call to getVariableMeta(sym) received a non-variable based Symbol!`, { 
            
        })
    }

}
