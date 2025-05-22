import findRoot from "find-root";
import { endsWith, Never, stripLeading, stripTrailing } from "inferred-types";
import { join } from "node:path";
import { cwd } from "node:process";
import { Diagnostic, Project, Symbol, ts } from "ts-morph";
import { InvalidConfig, MissingConfig, Unexpected } from "./errors";
import chalk from "chalk";
import { existsSync } from "node:fs";
import { ReaperApi, Feature, SymbolScope, SymbolMeta, Fluent, ReaperApi__Diagnostics, ReaperApi__Symbols__NoMeta, ReaperApi__Symbols__Meta, ReaperApi__Symbols__Base } from "./types";
import { isError } from "@yankeeinlondon/kind-error";
import { getSymbolsSummary } from "./ast/getSymbolsSummary";
import { asSymbolMeta } from "./ast/symbols";
import { getSymbols } from "./ast/getSymbols";
import { getDiagnostics, getFileDiagnostics } from "./ast/getDiagnostics";
import { parsePackageJson } from "./utils/parsePackageJson";
import { CWD, ROOT } from "./constants";
import FastGlob from "fast-glob";

type DiagInput<T extends ReaperApi<readonly Feature[]>> = {
    state: T,
    partial: string[]
};

/**
 * add `diagnostics` property to API surface
 */
function diag<
    T extends ReaperApi<readonly Feature[]>
>(
    input: DiagInput<T>
) {
    const { state, partial } = input;

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
    } satisfies ReaperApi__Diagnostics<["diagnostics"] | ["diagnostics", "diagnosticsPartial"]>["diagnostics"];

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
    } satisfies ReaperApi__Symbols__NoMeta<
        ["symbols"] | ["symbols", "symbolsPartial"]
    >["symbols"];

    if (features.includes("symbolMeta")) {
        const meta = ast.map(i => asSymbolMeta(i));

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
        } satisfies ReaperApi__Symbols__Base<
            ["symbols", "symbolMeta"] | 
            ["symbols", "symbolMeta", "symbolsPartial"]
        >
    } else {
        return {
            getSymbolsMeta() {
                return api({
                    ...state,
                    features: [...features, "symbolMeta"],
                    symbols: base
                })
            },
            symbols: base
        } satisfies ReaperApi__Symbols__Base<
            ["symbols"] | ["symbols", "symbolsPartial"]
        >;
    }
};




/**
 * Build base API, including submodules with calls to other functions
 */
function api<
    T extends ReaperApi<S>,
    S extends readonly Feature[]
>(
    state: T
) {
    const { features } = state;

    const baseApi = ({
        ...state,
        /** retrieve symbols */
        getSymbols: state.features.includes("symbols")
            ? Never
            : () => api({
                ...state,
                features: [...state.features, "symbols"],
                symbols: getSymbols(state.sourceFiles.ast)
            }),

        /** retrieve diagnostics */
        getDiagnostics: features.includes("diagnostics")
            ? Never
            : <P extends readonly string[]>(...partial: P) => api({
                ...state,
                features: partial
                    ? [...state.features, "diagnostics"]
                    : [
                        ...state.features, "diagnostics", "diagnosticsPartial"
                    ],
                diagnostics: diag({
                    state,
                    partial
                })
            }),

        diagnostics: features.includes("diagnostics")
            ? (state as any).diagnostics
            : Never,





    }) as unknown as ReaperApi<S>;

    return baseApi;
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
        const sourceFiles = project.getSourceFiles();
        const pkg = parsePackageJson(
            stripTrailing(filepath, "/tsconfig.json") || ROOT
        );

        return api({
            pkg,
            project,
            typeChecker,
            languageService,
            sourceFiles: { ast: sourceFiles },
            features: []
        }) as ReaperApi<[]>;
    } catch (err) {
        throw isError(err)
            ? Unexpected.proxy(err)
            : Unexpected(String(err))
    }
}

