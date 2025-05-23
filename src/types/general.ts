import { PackageJson, SemanticVersion, Suggest } from "inferred-types";

/**
 * The valid variant types of a function
 * 
 * - `named-fn` (e.g., `function greet(name: string) {...}`)
 * - `arrow-fn` (e.g., `const greet = (name: string) => {...}`)
 * - `named-fn` (e.g., `type FnWithProps = ((name: string) => string) & { foo: "bar"}`)
 */
export type FnType = "named-fn" | "arrow-fn" | "fn-intersection";

/**
 * specifies the scope of where the symbol is available:
 * 
 * - `local`: defined in a file and not exported so isolated to use within that file
 * - `module`: a symbol that _is_ exported by the repo being analyzed and
 * available anywhere the symbol is imported
 * - `external`: a symbol defined in an external repo/module 
 */
export type SymbolScope = "local" | "module" | "external";

/**
 * A _fully-qualified-name_ for a Symbol.
 */
export type FQN = `${"local" | "module" | "external"}::${number}::${string}`


/**
 * Describes a generic type
 */
export type GenericType = {
    name: string;
    type: string;
}

/**
 * The path to a `SourceFile`
 */
export type SourceFilePath = string;


