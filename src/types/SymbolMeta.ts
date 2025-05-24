import { Symbol } from "ts-morph";
import { FunctionParameter, FunctionReturn } from "./FunctionMeta";
import { FnType, FQN, GenericType, IsExportedSymbol, SymbolScope } from "./general";
import { PackageJson } from "./package";
import {  SymbolRef } from "./reference-types";
import { JsDocInfo, SymbolFlagKey, SymbolType } from "./symbol-ast-types";

export type AstKind =
    | "function"
    | "class"
    | "variable"
    | "type"
    | "type-utility"
    | "re-export"
    | "other";

export type ClassScope =
| "public"
| "protected"
| "private";


export type Decorator = {
    /** The name of the decorator (e.g., 'Injectable', 'Component') */
    name: string;
    /** The arguments passed to the decorator, if any (as strings or parsed values) */
    arguments?: string[]; // or: any[] if you want to support parsed values
    /** The full text of the decorator as it appears in the source */
    text: string;
};

export type ClassMethod = {
    /** the method name */
    name: string;

    /**
     * The level of access this method provides:
     * 
     * 1. public
     * 2. protected
     * 3. private
     */
    scope: ClassScope;

    /**
     * the docs for the given _method_ of a class
     */
    jsDocs: JsDocInfo[];

    isAbstract: boolean;
    isAsync: boolean;
    isGenerator: boolean;

    decorators: Decorator[];

    generics: GenericType[];
    /**
     * The parameters -- including any jsDocs associated with them --
     * which the class method defines
     */
    parameters: FunctionParameter[];
    /**
     * The _type_ returned by the class method (
     * and any assoociated JSDocs associated only to the return type)
     */
    returnType: FunctionReturn;

    toJSON(): string;
    toString(): string;
    toConsole(): string;
}

export type KindSpecific<K extends AstKind> = K extends "function"
    ? {
        /**
         * The type of function:
         * - `named-fn`
         * - `arrow-fn`
         * - `fn-intersection`
         */
        fnType: FnType;

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
    }
    : K extends "class"
    ? {
        extends: SymbolRef[];
        isAbstract: boolean;

        generics: GenericType[];

        /**
         * Static methods provided on the class definition
         */
        staticMethods: ClassMethod[];
        /**
         * Instance methods available on an instance of the class.
         */
        methods: ClassMethod[];

        /** the signature of the class's constructor */
        constructor?: ClassMethod;
    }
    : K extends "type"
    ? {
        /** the Typescript type definition */
        type: any;
        startLine: number;
        endLine: number;
    } 
    : K extends "type-utility"
    ? {
        generics: GenericType[];

    }
    : K extends "variable"
    ? {
        varScope: "let" | "const" | "var";
        type: any;

    }
    :{};

export type ScopeSpecific<S extends SymbolScope> = S extends "external"
    ? {
        /** information about the external source */
        externalSource: PackageJson
    }
    : {};


export type SymbolMeta<
    K extends AstKind = AstKind,
    S extends SymbolScope = SymbolScope
> = {
    __kind: "SymbolMeta";
    
    symbol: Symbol;

    /**
     * The _type information_ for the `Symbol`
     */
    type: SymbolType;

    /**
     * A broad categorization for 
     */
    astKind: K;

    /**
     * The scope for which the symbol is available:
     *  - `local` - local symbol definition, not exported in project
     *  - `module` - defined and exported within the given repo
     *  - `external` - a symbol imported from an external source
     */
    scope: S;

    /** symbol name */
    name: string,

    /** fully qualified name */
    fqn: FQN,

    /** 
     * The file path to the function's definition
     */
    filepath: string;

    isExported: IsExportedSymbol;

    /**
     * The JSDocs comments for the symbol as a whole
     * 
     * - does not include comments found for component parts of
     * the symbol
     */
    jsDocs: JsDocInfo[];

    /** 
     * `SymbolFlags` keys associated with the symbol
     */
    flags: SymbolFlagKey[];

    /** 
     * the epoch date of when this symbol was last changed in file system */
    updated: EpochTimeStamp;

    startLine: number;
    endLine: number;

    /**
     * Get's the full text for the symbol
     */
    getText(includeJsDocComments?: boolean): string;

    /**
     * Make the data structure _serialiable_ and then stringify
     * it into JSON format.
     */
    toJSON(): string;
    /**
     * Produce a concise textual description of the symbol.
     */
    toString(): string;
    /**
     * Similar to `toString()` but with ANSI escape sequences
     * for color and formatting appropriate for a terminal console.
     */
    toConsole(): string;
} & KindSpecific<K> & ScopeSpecific<S>
