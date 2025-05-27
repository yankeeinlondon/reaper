import type { JsDocInfo, SymbolType } from "./symbol-ast-types";

/** describes a function parameter */
export interface FunctionParameter {
    name: string;
    type: SymbolType;
    optional: boolean;
    defaultValue?: string;
    jsDocs?: JsDocInfo[];
}

/** describes a function return type */
export interface FunctionReturn {
    type: SymbolType;
    jsDocs?: JsDocInfo[];
}
