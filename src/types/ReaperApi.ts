import {
    And,
    AsArray,
    Contains,
    ExpandDictionary,
    If,
    Not,
} from "inferred-types";
import {
    Diagnostic,
    LanguageService,
    Project,
    SourceFile,
    Symbol,
    ts,
    TypeChecker
} from "ts-morph";

import {
    SymbolKind,
    SymbolMeta,
    SymbolScope
} from "src/types/symbol-ast-types";
import { FileDiagnostic } from "./file-ast-types";
import { DiagnosticError } from "~/errors";
import { PackageJson } from "./package";

export type Feature =
    | "diagnostics"
    | "diagnosticsPartial"
    | "symbols"
    | "symbolsPartial"
    | "symbolMeta"
    | "parsed";

export type Fluent<
    T extends readonly Feature[],
    F extends Feature | readonly Feature[]
> = T["length"] extends 0
    ? ReaperApi<AsArray<F>>
    : ReaperApi<[...T, ...AsArray<F>]>


/** a Summary view of a Symbol */
export type SymbolSummary = {
    /** the Symbol's token name */
    name: string,
    /** a fully qualified name for the Symbol */
    fqn: string,
    /** a broad level categorization of the Symbol */
    kind: SymbolKind,
    /** the scope (local, module, external) of the Symbol */
    scope: SymbolScope
}

export type ReaperApi__Symbols__None<T extends readonly Feature[]> = {
    /** 
     * Adds _some_ or _all_ of the project's `Symbol`'s to the
     * Fluent API under the `symbols` property.
     */
    getSymbols: If<
        Contains<T, "symbols">,
        never,
        <
            P extends readonly string[] | undefined
        >(partial?: P) => P extends undefined
            ? Fluent<T, "symbols">
            : Fluent<T, ["symbols", "symbolsPartial"]>
    >;
}

export type ReaperApi__Symbols__Base<T extends readonly Feature[]> =
    Contains<T, "symbolMeta"> extends true
    ? ReaperApi__Symbols__NoMeta<T> & ReaperApi__Symbols__Meta
    : {
        /** 
         * Adds a `symbols.meta` property to the Fluent API (as well
         * as `toJSON()`, `toString()`, and `toConsole()`).
         */
        getSymbolsMeta: () => Fluent<T, "symbolMeta">;
    } & ReaperApi__Symbols__NoMeta<T>

export type ReaperApi__Symbols__Meta = {
    /** all `Symbol` based resources */
    symbols: {

        /** 
         * Metadata on all of the `Symbol`'s being analyzed.
         */
        meta: SymbolMeta[];

        /**
         * Returns a string intended for output on a console screen:
         * 
         * - by default returns _all_ symbols being analyzed 
         * but you can reduce this to just `module`, `local`, 
         * or `external` scopes.
         * 
         * **Note:** if you need greater control in your filtering of Symbols
         * you can simply take the `symbols.meta` list and filter it and
         * then map to the `.toConsole()` method which each `SymbolMeta`
         * dictionary contains.
         */
        toScreen: <T extends SymbolScope>(scope?: T) => string;

        /**
         * A convenience method which allows conversion to a JSON string.
         */
        toJSON: <T extends SymbolScope>(scope?: T) => string;

        /**
         * A convenience method which allows conversion to a JSON string.
         * 
         * - **Note:** this is the same as `toJSON()` except that it's JSON
         * is more compact (aka, no CRLF, etc.)
         */
        toString: <T extends SymbolScope>(scope?: T) => string;
    }
}

/** `symbols` property on API surface */
export type ReaperApi__Symbols__NoMeta<
    T extends readonly Feature[],
> = {
    /** `Symbol` based resources */
    symbols: {
        /** a tuple of **ts-morph** `Symbol`'s */
        ast: readonly Symbol[];

        /** 
         * An indicator of whether "all" symbols have been included 
         * or only a _partial_ (aka, specified) number of symbols.
         */
        isPartial: If<Contains<T, "symbolsPartial">, true, false>;

        /**
         * A tuple summary of all the symbols in the project.
         * 
         * - the `SymbolSummary` provides basics like `name`,`fqn`,
         * `kind`, and `scope` for each symbol
         */
        summary: SymbolSummary[];
    }
}


export type ReaperApi__SourceFiles<_T extends readonly Feature[]> = {
    /** 
     * All of the `SourceFile`'s in the project
     * 
     * **Note:** _this is not seriazable but instead a resource you
     * can use directly to get to **ts-morph** API's._
    */
    ast: SourceFile[];


}

export type ReaperApi__Diagnostics__None<T extends readonly Feature[]> = {
    /**
     * Gets diagnostics across the project's files and returns
     * a Fluent API with the `diagnostics` property populated.
     */
    getDiagnostics: If<
        Contains<T, "diagnostics">,
        never,
        <P extends readonly string[]>(...partial: P) => P["length"] extends 0
            ? Fluent<T, "diagnostics">
            : Fluent<T, ["diagnostics", "diagnosticsPartial"]>
    >;
}

export type ReaperApi__Diagnostics<T extends readonly Feature[]> = {
    /** all diagnostic resources */
    diagnostics: {
        /**
         * All of the project's diagnostics across all files.
         * 
         * **Related:** `fileDiagnostics`
         */
        ast: Diagnostic<ts.Diagnostic>[];

        /**
         * Boolean flag indicating whether the user had run diagnostics
         * on _all_ files or just some.
         */
        isPartial: If<Contains<T, "diagnosticsPartial">, true, false>,

        /**
         * Source files which have diagnostics associated with them.
         */
        filesWithDiagnostics: Set<string>;

        /**
         * The files which were evaluated for having diagnostics.
         */
        filesEvaluated: Set<string>;

        /**
         * Source files which have diagnostics associated with them
         * which have had escape codes added to them for nicer
         * reporting to the console screen.
         * 
         * **Note:** if you're using `wezterm` or a supported console
         * the filename's should all be "clickable" to bring up in your
         * editor.
         */
        filesToConsole: () => string[];

        /**
         * All of the project's diagnostics mapped to information
         * derived from the `SourceFile` the dignostic was raised in.
         * 
         * **Note:** this is a serializable product of using the AST
         * for the source files to determine metadata about diagnostics
         * found in the project.
         */
        meta: FileDiagnostic[];

        /**
         * Converts all diagnostics into `Diagnostic` errors
         */
        toError: () => typeof DiagnosticError.errorType[];
    }
}


export type ReaperApi<T extends readonly Feature[]> = {
    /**
     * the **ts-morph** `Project` API
     */
    project: Project;

    /**
     * the **ts-morph** `TypeChecker` API
     */
    typeChecker: TypeChecker;

    /**
     * the **ts-morph** `LanguageService` API
     */
    languageService: LanguageService;

    /**
     * The properties found in the `package.json` file (if found)
     */
    pkg: PackageJson;

    /**
     * All resources relating directly to `SourceFile` information.
     */
    sourceFiles: ReaperApi__SourceFiles<T>;

    features: T;
} & (
        Contains<T, "symbols"> extends true
        ? ReaperApi__Symbols__Base<T>
        : ReaperApi__Symbols__None<T>
    ) & (
        Contains<T, "diagnostics"> extends true
        ? ReaperApi__Diagnostics<T>
        : ReaperApi__Diagnostics__None<T>
    )

