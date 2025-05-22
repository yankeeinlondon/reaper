import { If, IsEqual } from "inferred-types";
import { FQN, GenericType, SymbolScope } from "./general";
import { JsDocInfo, SymbolFlagKey } from "./symbol-ast-types";


export type FunctionParameter = {
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
    jsDocs?: JsDocInfo[];
}; // describes a function parameter
export type FunctionReturn = {
    type: string;
    jsDocs?: JsDocInfo[];
}; // describes a function return type


export type FunctionMeta<S extends SymbolScope = SymbolScope> = {
    name: string;
    fqn: FQN;
    /**
     * The scope for which the symbol is available:
     *  - `local` - local symbol definition, not exported in project
     *  - `module` - defined and exported within the given repo
     *  - `external` - a symbol imported from an external source
     */
    scope: S;

    /** 
     * The external source (only found when referencing an "external"
     * symbol)
     */
    externalSource: If<
        IsEqual<S,"external">,
        {name: string, version?: string},
        never
    >;

    /** 
     * The file path to the function's definition
     */
    filepath: string;

    startLine: number;
    endLine: number;

    /** 
     * `SymbolFlags` keys associated with the symbol
     */
    flags: SymbolFlagKey[];

    generics: GenericType[];
    /**
     * The parameters -- including any jsDocs associated with them --
     * which the function depends on
     */
    parameters: FunctionParameter[];
    /**
     * The _type_ returned by the function (
     * and any assoociated JSDocs associated only to the return type)
     */
    returnType: FunctionReturn;

    /**
     * The JSDocs comments for the function as a whole (but excluding
     * the _per parameter_ JSDocs which will instead be captured in 
     * the `parameters` property)
     */
    jsDocs: JsDocInfo[];

    /** 
     * the epoch date of when this symbol was last changed in file system */
    updated: number;
}
