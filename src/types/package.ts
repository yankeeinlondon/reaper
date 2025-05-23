import { Opt, SemanticVersion, Suggest } from "inferred-types";

type NpmPrefix = "" | "^" | ">=" | ">" | "~";
type NpmVersionNum = `${number}${Opt<`.${number}`>}${Opt<`.${number}`>}`;

/**
 * **NpmVersion**
 *
 * an [npm](https://npmjs.org) version / variant range.
 */
export type NpmVersion = `${NpmPrefix}${NpmVersionNum}`;

type RelativePath = `.${string}`

/**
 * The general structure of a `package.json` file.
 */
export type PackageJson = {
    /** The name of the package. */
    name?: string;
    /** 
     * The version of the package, typically following semantic
     * versioning. 
     */
    version?: Suggest<SemanticVersion<false>>;
    /** A short description of the package. */
    description?: string;

    /** The entry point of the package, usually for CommonJS modules. */
    main?: string;
    /** The module entry point for ES modules. */
    module?: string;
    /** Defines shortcut commands for package scripts. */
    scripts?: Record<Suggest<"build"|"test"|"release"|"watch">, string>;
    /** A map of package dependencies required for the project. */
    dependencies?: Record<string, NpmVersion>;
    /** A map of development-only dependencies. */
    devDependencies?: Record<string, NpmVersion>;
    /** A map of peer dependencies that must be provided by the consumer. */
    peerDependencies?: Record<string, NpmVersion>;
    /** A map of optional dependencies that won't break the package if missing. */
    optionalDependencies?: Record<string, NpmVersion>;
    /** Dependencies bundled when the package is published. */
    bundledDependencies?: string[] | Record<string, NpmVersion>;
    /** Keywords to help identify the package in searches. */
    keywords?: string[];
    /** The author of the package, as a string or object with details. */
    author?: string | { name: string; email?: string; url?: string };
    /** A list of contributors to the package, as strings or objects with details. */
    contributors?: (string | { name: string; email?: string; url?: string })[];
    /** The license for the package, typically an SPDX identifier. */
    license?: Suggest<"MIT">;
    /** Repository information for the package. */
    repository?: string | { type?: string; url: string; directory?: string };
    /** Information about how to report bugs in the package. */
    bugs?: string | { url?: string; email?: string };
    /** The URL to the homepage of the package. */
    homepage?: string;
    /** Specifies the Node.js and other environments the package supports. */
    engines?: Record<string, string>;
    /** Specifies the supported operating systems. */
    os?: string[];
    /** Specifies the supported CPU architectures. */
    cpu?: string[];
    /** Indicates if the package is private and cannot be published. */
    private?: boolean;
    /** Specifies workspace configuration for monorepos. */
    workspaces?: string[] | { packages?: string[]; nohoist?: string[] };
    /** Overrides versions of dependencies for nested packages. */
    resolutions?: Record<string, string>;
    /** Information about funding for the package. */
    funding?: string | { type?: string; url: string };
    /** Browser-specific entry points or fields for the package. */
    browser?: string | Record<string, string>;
    /** User-defined configuration values for package-specific settings. */
    config?: Record<string, any>;
    /** Defines the package's entry points for exports. */
    exports?: Record<RelativePath, Record<Suggest<"types" | "import" | "require">, RelativePath>>;
    /** Defines the package's entry points for imports. */
    imports?: Record<string, string | Record<string, string>>;
    /** A list of files included when the package is published. */
    files?: string[];
    /** Specifies executable files for the package. */
    bin?: string | Record<string, string>;
    /** Specifies man pages for the package. */
    man?: string | string[];
    /** Specifies various directories used by the package. */
    directories?: {
        /** The directory for library files. */
        lib?: string;
        /** The directory for executable binaries. */
        bin?: string;
        /** The directory for man pages. */
        man?: string;
        /** The directory for documentation. */
        doc?: string;
        /** The directory for examples. */
        example?: string;
        /** The directory for tests. */
        test?: string;
    };
    /** Specifies whether the package is a module or CommonJS package. */
    type?: "module" | "commonjs";
    /** Configuration for how the package is published. */
    publishConfig?: Record<string, any>;
    /** Specifies the type definition file for the package. */
    types?: string;
    /** An alias for `types`, specifying the type definition file. */
    typings?: string;
    /** Indicates whether the package has side effects or is tree-shakable. */
    sideEffects?: boolean | string[];
    /** Configuration for ESLint specific to the package. */
    eslintConfig?: Record<string, any>;
    /** Configuration for Prettier specific to the package. */
    prettier?: Record<string, any>;
    /** The path to the package's stylesheet entry. */
    style?: string;

    pnpm?: {
        overrides?: Record<string, NpmVersion>;
        onlyBuiltDependencies?: string[];
        [key: string]: unknown;
    };

    tsup?: any;

    [key: string]: unknown;
}
