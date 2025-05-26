import { Symbol } from "ts-morph";
import {
    ClassMethod,
    ExportType,
    FnVariant,
    FunctionParameter,
    FunctionReturn,
    GenericType,
    JsDocInfo,
    PackageJson,
    SymbolFlagKey,
    SymbolRef,
    SymbolScope,
    SymbolType
} from "~/types";

export type AstKind =
    | "function"
    | "class"
    | "variable"
    | "type"
    | "type-utility"
    | "re-export"
    | "other";

export type KindSpecific<K extends AstKind> = K extends "function"
    ? {
        /**
         * The _variant type_ of the function:
         * - `named-fn`
         * - `arrow-fn`
         * - `fn-intersection`
         */
        fnVariant: FnVariant;

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

        
        /** the signature of the class's constructor */
        constructor?: ClassMethod;

        /**
         * Static methods provided on the class definition
         */
        staticMethods: ClassMethod[];
        /**
         * Instance methods available on an instance of the class.
         */
        methods: ClassMethod[];

    }
    : K extends "type"
    ? {
    } 
    : K extends "type-utility"
    ? {
    }
    : K extends "variable"
    ? {
        /** the _scope_ which the variable was declared with */
        varScope: "let" | "const" | "var";
    }
    :{};

export type ScopeSpecific<S extends SymbolScope> = S extends "external"
    ? {
        /** information about the external source */
        externalSource: PackageJson
    }
    : {};


export type SymbolMeta__Base<
    K extends AstKind = AstKind,
    S extends SymbolScope = SymbolScope
> = {
    __kind: "SymbolMeta";
    
    symbol: Symbol;
    /**
     * A string reference which maintains a `1:1` relationship
     * with a `Symbol` and can be used to lookup a `SymbolMeta`
     * dictionary from `SYMBOLS` cache table.
     */
    ref: SymbolRef<K>;

    /**
     * Similar to the `ref` property but mixes content changes
     * into the string/hash value so that cache freshness can
     * be checked.
     */
    hash: SymbolRef<K>;

    /**
     * The _type information_ for the `Symbol`
     */
    type: SymbolType;

    /**
     * A broad categorization for 
     */
    astKind: K;

    generics: GenericType[];

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
    fqn: string,

    /** 
     * The file path to the function's definition
     */
    filepath: string;

    exportType: ExportType;

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
}


export type SymbolMeta<
    K extends AstKind = AstKind,
    S extends SymbolScope = SymbolScope
> = SymbolMeta__Base<K,S> & KindSpecific<K> & ScopeSpecific<S>
