import { Symbol } from "ts-morph";
import { FunctionParameter, FunctionReturn } from "./FunctionMeta";
import { FnType, FQN, GenericType, SymbolScope } from "./general";
import { PackageJson } from "./package";
import { ClassRef, TypeRef, TypeUtilityRef } from "./reference-types";
import { JsDocInfo, SymbolFlagKey } from "./symbol-ast-types";

export type AstKind =
    | "function"
    | "class"
    | "variable"
    | "type"
    | "type-utility"
    | "re-export";

export type ClassScope =
| "public"
| "protected"
| "private";

type ClassMethod = {
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

    toString(): string;
    toConsole(): string;
}

type KindSpecific<K extends AstKind> = K extends "function"
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
        extends: (ClassRef | TypeRef | TypeUtilityRef)[];
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
        constructor: ClassMethod;
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

type ScopeSpecific<S extends SymbolScope> = S extends "external"
    ? {
        /** information about the external source */
        externalSource: PackageJson
    }
    : {};


export type SymbolMeta<
    K extends AstKind = AstKind,
    S extends SymbolScope = SymbolScope
> = {
    symbol: Symbol;

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
    updated: number;

    startLine: number;
    endLine: number;

    /**
     * Get's the full text for the symbol
     */
    getText(): string;

    toJSON(): string;
    toString(): string;
    toConsole(): string;
} & KindSpecific<K> & ScopeSpecific<S>
