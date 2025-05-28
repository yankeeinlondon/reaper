import { endsWith, isString, stripTrailing } from "inferred-types";
import { FileMeta, ReaperApi } from "~/types";
import { getRoot } from "~/constants";
import { join } from "path";
import { InvalidConfig, MissingConfig } from "~/errors";
import chalk from "chalk";
import { existsSync } from "fs";
import { Project } from "ts-morph";
import { SimpleGit } from "simple-git";
import { isObject } from "./type-guards";
import { isMonorepo } from "@yankeeinlondon/is-monorepo";
import { parsePackageJson} from "@yankeeinlondon/package-json"
import { provideFilesApi } from "./api/provideFilesApi";

let git: null |SimpleGit = null;

export type ReaperOpts = {
    /** the explicit filepath to the **tsconfig** file */
    filepath?: string;

    /** 
     * one or more "glob patterns" indicating the source files
     * you would like to initialize to start.
     * 
     * **Note:** by default _all_ source files are initialized
     * and that is a pretty good default for most projects other
     * than very large ones or instances where you only need 
     * file information for a small subset of files.
     */
    sourceFiles?: string | string[];
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
export function reaper(
    filepath?: string | ReaperOpts
): ReaperApi<[]> | Error {
    const configPath = isString(filepath)
        ? filepath
        : isObject(filepath)
            ? filepath.filepath
            : undefined;
    const monorepo = isMonorepo();


        const configFile = configPath
            ? endsWith(".json") ? configPath : join(configPath, "tsconfig.json")
            : join(getRoot(), "tsconfig.json");

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
            stripTrailing(configPath, "/tsconfig.json") || getRoot()
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
        }) satisfies  ReaperApi<[]>;
}

