import { JsDocInfo, SymbolType } from "./symbol-ast-types";

/** describes a function parameter */
export type FunctionParameter = {
    name: string;
    type: SymbolType;
    optional: boolean;
    defaultValue?: string;
    jsDocs?: JsDocInfo[];
}; 

/** describes a function return type */
export type FunctionReturn = {
    type: SymbolType;
    jsDocs?: JsDocInfo[];
}; 

