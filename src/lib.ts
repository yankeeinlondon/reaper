import findRoot from "find-root";
import { AsArray, asArray, Dictionary, endsWith, Never, stripLeading, stripTrailing } from "inferred-types";
import { join } from "node:path";
import { cwd } from "node:process";
import { Diagnostic, Project, SourceFile, Symbol, ts } from "ts-morph";
import { InvalidConfig, MissingConfig, MissingFeature, Unexpected } from "./errors";
import chalk from "chalk";
import { existsSync } from "node:fs";
import { 
    ReaperApi, Feature, 
    Fluent, 
    ReaperApi__Diagnostics__Loaded, 
    ReaperApi__Symbols__BaseSymbols, 
    ReaperApi__Symbols__Meta, 
    ReaperApi__Symbols__Switch, 
    FileMeta,
    FilesApi
} from "./types";
import { isError } from "@yankeeinlondon/kind-error";
import { getSymbolsSummary } from "./ast/getSymbolsSummary";
import { asSymbolsMeta } from "./ast/asSymbolsMeta";
import { getSymbols } from "./ast/getSymbols";
import { getDiagnostics, getFileDiagnostics } from "./ast/getDiagnostics";
import { parsePackageJson } from "./utils/parsePackageJson";
import { CWD, ROOT } from "./constants";
import FastGlob from "fast-glob";
import { getSymbolsMeta } from "./ast";
import { hasFeatures, missingFeatures } from "./type-guards/hasFeature";
import { wrapFn } from "./utils";
import { createFnWithProps } from "./utils/createFnWithProps";

type DiagInput<T extends ReaperApi<S>, S extends readonly Feature[]> = {
    state: T,
    partial: readonly string[]
};

/**
 * add `diagnostics` property to API surface
 */
function diag<
    T extends ReaperApi<S>,
    S extends readonly Feature[]
>(
    input: DiagInput<T,S>
) {
    const { state, partial } = input;
    if(hasFeatures(state, "diagnostics")) {
        throw MissingFeature(`Attempt to add the "diagnostics" property after already having set the state to include the "diagnostics" feature. This should not happen!`, {input})
    }

    const keepers = partial.length > 0
        ? FastGlob.sync(partial.map(i => join(CWD, i)))
        : null;

    const sourceFiles = keepers
        ? state.sourceFiles.ast.filter(
            i => {
                const filepath = i.getFilePath().toString();
                return keepers.includes(filepath);
            }
        )
        : state.sourceFiles.ast;
    const diagnostics = getDiagnostics(sourceFiles);
    const fileDiagnostics = getFileDiagnostics(sourceFiles);
    const filesWithDiagnostics = new Set<string>(
        (fileDiagnostics.map(i => i.filepath).filter(i => i) as string[])
    );
    const filesEvaluated = new Set<string>(sourceFiles.map(
        i => i.getFilePath().toString() as string
    ));

    const meta = getFileDiagnostics(diagnostics);

    let surface = {
        ast: diagnostics,
        isPartial: partial.length > 0,
        filesWithDiagnostics,
        filesEvaluated,
        meta,

        filesToConsole: () => {
            return Array.from(filesWithDiagnostics);
        },

        toError() {
            return meta.map(i => i.toError())
        }
    } satisfies ReaperApi__Diagnostics__Loaded<["diagnostics"] | ["diagnostics", "diagnosticsPartial"]>["diagnostics"];

    return surface;
}

function symbolsApi<T extends readonly Feature[]>(
    state: ReaperApi<T>
) {
    const { features } = state;
    const ast = getSymbols(state.sourceFiles.ast);

    const base = {
        ast,
        isPartial: features.includes("symbolsPartial") ? true : false,
        summary: getSymbolsSummary(ast),
    } satisfies ReaperApi__Symbols__BaseSymbols<
        ["symbols"] | ["symbols", "symbolsPartial"]
    >["symbols"];

    if (features.includes("symbolsMeta")) {
        const meta = ast.map(i => asSymbolsMeta(i));

        const withMeta = {
            meta,
            toScreen: () => meta.map(i => i.toScreen()).join("\n"),
            toJSON: () => JSON.stringify(meta, null, 2),
            toString: () => JSON.stringify(meta)

        } satisfies ReaperApi__Symbols__Meta["symbols"]

        return {
            symbols: {
                ...base,
                ...withMeta
            }
        } satisfies ReaperApi__Symbols__Switch<
            ["symbols", "symbolsMeta"] |
            ["symbols", "symbolsMeta", "symbolsPartial"]
        >
    } else {
        return {
            getSymbolsMeta() {
                return api({
                    ...state,
                    features: [...features, "symbolsMeta"],
                    symbols: base
                })
            },
            symbols: base
        } satisfies ReaperApi__Symbols__Switch<
            ["symbols"] | ["symbols", "symbolsPartial"]
        >;
    }
};

function fluent<
    T extends ReaperApi<S>,
    S extends readonly Feature[],
    F extends Feature | Feature[],
    KV extends Dictionary<string>
>(
    state: T,
    feature: F,
    kv: KV
) {
    return {
        ...state,
        features: [...state.features, ...asArray(feature)],
        ...kv
    } as unknown as ReaperApi<[...S, ...AsArray<F>]>

}

function addSymbols<T extends ReaperApi<S>, S extends readonly Feature[]>(
    state: T
) {
    return <P extends readonly string[]>(...partial: P) => {
        const ast = getSymbols(state.sourceFiles.ast);
        return {
            ...state,
            features: partial.length === 0
                ? [...state.features, "symbols"]
                : [...state.features, "symbols", "symbolsPartial"],
            symbols: {
                ast,
                isPartial: partial.length === 0
                    ? false
                    : true,
                summary: getSymbolsSummary(ast)
            }
        } as unknown as Fluent<S, ["symbols"]> | Fluent<S, ["symbols", "symbolsPartial"]>;
    }
}

function addSymbolsMeta<
    T extends ReaperApi<S>,
    S extends readonly ["symbols", ...Feature[]]
>(
    state: T
) {
    if (!hasFeatures(state, "symbols")) {
        throw MissingFeature(`call to function addSymbolsMeta() was made before the feature "symbols" had been set!`, {
            features: state.features
        });
    }

    const ast = (state as unknown as ReaperApi<["symbols"]>)
        .symbols.ast;
    const meta = getSymbolsMeta(ast);

    const withMeta = {
        meta,
        toScreen: () => meta.map(i => i.toScreen()).join("\n"),
        toJSON: () => JSON.stringify(meta, null, 2),
        toString: () => JSON.stringify(meta)
    } satisfies ReaperApi__Symbols__Meta["symbols"];

    return fluent(
        state,
        "symbolsMeta",
        {
            symbols: {
                ...(state as unknown as ReaperApi<["symbols"]>).symbols,
                ...withMeta
            }
        }
    )
}

function addDiagnostics<
    T extends ReaperApi<S>,
    S extends readonly Feature[]
>(state: T) {
    if (missingFeatures(state, "diagnostics")) {
        return <P extends readonly string[]>(...partial: P) =>
            partial.length === 0
                ? fluent(
                    state,
                    ["diagnostics"],
                    {
                        diagnostics: diag({ state, partial })
                    }
                )
                : fluent(
                    state,
                    ["diagnostics", "diagnosticsPartial"],
                    {
                        diagnostics: diag({ state, partial })
                    }
                )
    } else {
        return Never;
    }
}

const baseApi = <
    T extends ReaperApi<S>,
    S extends readonly Feature[]
>(state: T) => ({
    ...state,

    // getSymbols: hasFeatures(state, "symbols")
    //     ? Never
    //     : addSymbols(state),

    // getSymbolsMeta: (
    //     hasFeatures(state, "symbols") &&
    //     missingFeatures(state, "symbolsMeta")
    // )
    //     ? addSymbolsMeta(state)
    //     : Never,

    ...(
        missingFeatures(state, "diagnostics")
        ? { getDiagnostics: addDiagnostics(state) }
        : { diagnostics: (state as any).diagnostics }
    ),
    ...(
        missingFeatures(state, "runtime")
        ? { getRuntime: addDiagnostics(state) }
        : { runtime: (state as any).runtime }
    ),
    ...(
        missingFeatures(state, "types")
        ? { getTypes: addDiagnostics(state) }
        : { types: (state as any).types }
    ),


}) as ReaperApi<S>;


/**
 * Build base API, including submodules with calls to other functions
 */
function api<
    T extends ReaperApi<S>,
    S extends readonly Feature[]
>(
    state: T
) {


    return baseApi(state);
}



function provideFilesApi(files: SourceFile[]): FilesApi {
    const summary = files.map(
        f => ({
            filepath: f.getFilePath(),
            baseName: f.getBaseName(),
            lines: f.getEndLineNumber(),
            /** get the full text of the file */
            getText:  f.getText,
            /** get the export symbols for the file */
            getExportSymbols: wrapFn(
                f.getExportSymbols,
                (fn, args) => {
                    const symbols = fn(...args);
                    addSymbols(symbols);
                }
            ),
            getImports: f.getImportDeclarations,

        })
    );
    const fn = () => summary;
    const kv = {
        toString() {
            return ""
        },
        toJSON() {
            return ""
        },
        toConsole() {

        }
    }
    return createFnWithProps(fn,kv);
}


/**
 * **reaper**`(filepath?: string)`
 * 
 * Starts a `ts-morph` project, sets up a TypeChecker and
 * a LanguageService and then presents an Fluent API surface
 * which allows for more metadata to be loaded in on demand.
 * 
 * ```ts
 * const meta = reaper();
 * if(!isError(meta)) {
 *      // use API
 * }
 * ```
 * 
 * **Note:** the _optional_ filepath should point to a `tsconfig.json`
 * file or the directory where one exists. If none is provided it will
 * try and find one at the root of the repo the caller (may) be in.
 */
export function reaper(filepath?: string): ReaperApi<[]> | Error {
    try {
        const configFile = filepath
            ? endsWith(".json") ? filepath : join(filepath, "tsconfig.json")
            : findRoot(cwd()) ? join(findRoot(cwd()), "tsconfig.json") : undefined;
        if (!configFile) {
            return MissingConfig(`The filepath "${chalk.blue(filepath)}" was passed into ${chalk.bold("reaper()")} but no tsconfig file could be found!`)
        }
        if (!existsSync(configFile)) {
            return InvalidConfig(`The tsconfig file ${chalk.blue(configFile)} does not exist!`);
        }

        const project = new Project({ tsConfigFilePath: configFile });
        const typeChecker = project.getTypeChecker();
        const languageService = project.getLanguageService();
        const ast = project.getSourceFiles();

        const pkg = parsePackageJson(
            stripTrailing(filepath, "/tsconfig.json") || ROOT
        );
        const sourceFiles = {
            ast,
            files: provideFilesApi(ast),
            getFileDetails(file: string): FileMeta {
                return null as unknown as FileMeta
            }
        }

        return api({
            pkg,
            project,
            typeChecker,
            languageService,
            sourceFiles,
            features: []
        } satisfies  ReaperApi<[]>;
    } catch (err) {
        throw isError(err)
            ? Unexpected.proxy(err)
            : Unexpected(String(err))
    }
}

