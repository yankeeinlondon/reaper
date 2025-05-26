import {
    AsArray,
    Contains,
    If,
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
    SymbolsMeta,
} from "src/types/symbol-ast-types";
import { FileDiagnostic, FileMeta } from "./file-types";
import { DiagnosticError } from "~/errors";
import { PackageJson } from "./package";
import { SourceFilePath, SymbolScope } from "./general";
import { FunctionRef, ReExportRef, TypeUtilityRef, VariableRef } from "./reference-types";
import { AstKind, SymbolMeta } from "./SymbolMeta";

export type Feature =
    | "diagnostics"
    | "diagnosticsPartial"
    | "runtime"
    | "types";

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
    kind: AstKind,
    /** the scope (local, module, external) of the Symbol */
    scope: SymbolScope
}


export type ReaperApi__Runtime__None<T extends readonly Feature[]> = {
    /** 
     * Finds all the runtime's Symbols and provides an API
     * surface for it under the `runtime` property.
     */
    getRuntime: () => Fluent<T, "runtime">;
}

export type ReaperApi__Runtime__Ready<_T extends readonly Feature[]> = {
    runtime: {
        /** all the symbols related to the runtime environment */
        ast: Symbol[],
        functions: () => SymbolMeta<"function">[],
        classes: () => SymbolMeta<"class">[],
        variables: () => SymbolMeta<"variable">[]
    }
}

export type ReaperApi__Types__None<T extends readonly Feature[]> = {
    /** 
     * Finds all the runtime's Symbols and provides an API
     * surface for it under the `runtime` property.
     */
    getTypes: () => Fluent<T, "types">;
}


export type ReaperApi__Types__Loaded<
    _T extends readonly Feature[]
> = {
    /** all the symbols related to the types/design environment */
    ast: Symbol[],
    /** all of the types defined in the repo */
    types: () => SymbolMeta<"function">[],
    /** all the type utilities defined in the repo */
    typeUtilities: () => SymbolMeta<"class">[]
}



export type ReaperApi__SourceFiles__Meta<_T extends readonly Feature[]> = {
    fileImports: any;

    reExports: Map<SourceFilePath, ReExportRef[]>;
    exportedFunctions: Map<SourceFilePath, FunctionRef[]>;
    exportedClasses: Map<SourceFilePath, ClassRef>;

    /** 
     * Dictionary where:
     *    - `keys` are the SourceFilePath
     *    - `values` are an array of exported types
     * 
     * **Note:** _types_ are any type or interface definition 
     * which **does not** have any **generics** associated with them.
     */
    exportedTypes: Map<SourceFilePath, TypeRef>;
    /** 
     * Dictionary where:
     *    - `keys` are the SourceFilePath
     *    - `values` are an array of exported types
     * 
     * **Note:** _types utilities_ are any type or interface definition 
     * which **has** at least one **generic** parameter.
     */
    exportedTypeUtilities: Map<SourceFilePath, TypeUtilityRef>;
    exportedValues: Map<SourceFilePath, VariableRef>;


}

export type FilesApi = (
    () => FileMeta[]
) & {
    toString(): string;
    toJSON(): string;
    toConsole(): string;
}


export type ReaperApi__SourceFiles<_T extends readonly Feature[]> = {
    /** 
     * All of the `SourceFile`'s in the project
     * 
     * **Note:** _this is not seriazable but instead a resource you
     * can use directly to get to **ts-morph** API's._
    */
    ast: SourceFile[];
    /** 
     * Get file details for _all_ source files.
     */
    files: FilesApi;
    /**
     * Get details (imports, exports, etc.) for a particular file.
     */
    getFileDetails(file: string): FileMeta;
}

export type ReaperApi__Diagnostics__None<T extends readonly Feature[]> = {
    /**
     * Gets diagnostics across the project's files and returns
     * a Fluent API with the `diagnostics` property populated.
     */
    getDiagnostics:  <P extends readonly string[]>(...partial: P) => P["length"] extends 0
            ? Fluent<T, "diagnostics">
            : Fluent<T, ["diagnostics", "diagnosticsPartial"]>
}

export type ReaperApi__Diagnostics__Loaded<T extends readonly Feature[]> = {
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
        ReaperApi__Symbols__Switch<T>
    ) & (
        Contains<T, "diagnostics"> extends true
        ? ReaperApi__Diagnostics__Loaded<T>
        : ReaperApi__Diagnostics__None<T>
    )

