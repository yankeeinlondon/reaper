import { Symbol as MorphSymbol } from "ts-morph";
import { SYMBOLS } from "~/constants";

function addSymbol(sym: MorphSymbol) {
    const fqn = sym.getFullyQualifiedName;
    const aa = sym.compilerSymbol

}
