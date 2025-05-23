import {
    JSDocLink,
    JSDocLinkCode,
    JSDocLinkPlain,
    JSDocText,
    ts
} from "ts-morph";
import { SymbolScope, GenericType, FQN } from "./general";


/**
 * The union type which represents all the _keys_ to the `ts.SymbolFlags` enumeration.
 */
export type SymbolFlagKey = keyof {
    [K in keyof typeof ts.SymbolFlags]: K
};

export type SymbolKind =
    | "type-defn" // a type's definition
    | "type-constraint" // this is a "type" which is defined in an external repo
    | "external-type"
    | "property" // the property on an object (or maybe other container)
    | "scalar"
    | "container"
    | "class"
    | "instance"
    | "union-or-intersection"
    | "function"
    | "const-function"
    | "other";


export type SymbolReference = {
    name: string;
    kind: SymbolKind;
    fqn: FQN;
}

/**
 * **symbolsMeta**
 * 
 * Key meta-data for a `Symbol` which is serializable
 * (unlike a **ts-morph** `Symbol`).
 * 
 * **Note:** this is the _type_ to use in the cache and is meant to
 * contain all relevant data on Symbols that this plugin would
 * want to report on.
 */
export type SymbolsMeta<
    TKind extends SymbolKind = SymbolKind
> = {
    /** symbol name */
    name: string;
    /** 
     * The fully qualified name of the dependency aims to provide
     * a unique-assured token for caching and explicit referencing.
     * The scope of the symbol will depend on it's format:
     * 
     * - a locally defined symbol within the repo being analyzed will look
     * like: `local::<filepath-hash>::<name>`
     * - an module you are exporting in the repo being analyzed will look
     * like: `module::<fqn-hash>::<name>`
     * - any reference to an external symbol will be: `ext::<source-hash>::<name>`
     */
    fqn: FQN;
    /**
     * The scope for which the symbol is available:
     *  - `local` - local symbol definition, not exported in project
     *  - `module` - defined and exported within the given repo
     *  - `external` - a symbol imported from an external source
     */
    scope: SymbolScope;

    externalSource?: {name: string, version?: string};

    /**
     * The file path to the symbol's definition.
     * 
     * **Note:** if the symbol is a "type" then this should always
     * be resolved but for some other _kinds_ of `Symbol` it is optional
     */
    filepath: string;
    /** based on _flags_ this symbol appears to be a _type_ symbol */
    isTypeSymbol: boolean;

    /**
     * A type which takes at least _one_ generic parameter is considered
     * a "type utility".
     */
    isTypeUtility: boolean;

    /** based on _flags_ this symbol appears to be a _variable_ symbol */
    isVariable: boolean;
    /** based on _flags_ this symbol appears to be a _function_ symbol */
    isFunction: boolean;

    reExportPaths?: string[];

    startLine: TKind extends "type-defn" ? number : number | undefined;
    endLine: TKind extends "type-defn" ? number : number | undefined;
    /** 
     * The `symbol.getFlags()` returns a bitwise operation that
     * isn't very human intelligible; this reverse engineers the
     * `SymbolFlags` enumeration keys which went into generating 
     * this number.
     */
    flags: SymbolFlagKey[];

    /**
     * The generic symbols used by the symbol
     */
    generics: GenericType[];

    jsDocs: JsDocInfo[];

    /**
     * Broad brush representation of the _kind_ of symbol this is
     * based largely on which Symbol flags were found.
     */
    kind: TKind;

    refs: SymbolReference[];

    /** 
     * the epoch date of when this symbol was last changed in file system */
    updated: number;

    /** a screen-ready summary of the symbol */
    toScreen(): string;

    toJSON(): string;
    toString(): string;
}

/**
 * an individual tag and tag comment
 */
export type JsDocTag = {
    tagName: string;
    comment: string | (JSDocText | JSDocLink | JSDocLinkCode | JSDocLinkPlain | undefined)[] | undefined;
}

export type JsDocInfo = {
    comment: string;
    tags: JsDocTag[];
}
