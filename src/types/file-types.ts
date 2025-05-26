import { Diagnostic, DiagnosticCategory, SourceFile } from "ts-morph";
import { DiagnosticError } from "~/errors";
import { PackageJson } from "inferred-types";
import { SymbolRef } from "./reference-types";
import { FILE_REF_PREFIX } from "~/constants";
import { DiagRef } from "./diagnostic-types";


export type FileRef = `${typeof FILE_REF_PREFIX}${string}`


export type InternalSymbolImport = {
    __kind: "SymbolImport";
    source: "internal";
    symbol: SymbolRef;
    /** where is this file defined */
    definedIn: SourceFile;
}

export type ExternalSymbolImport = {
    __kind: "SymbolImport";
    source: "external";
    symbol: SymbolRef;
    package: PackageJson;
}

export type SymbolImport = InternalSymbolImport | ExternalSymbolImport;


/**
 * **FileLookup**
 * 
 * Keys are relative filenames (from repo root or PWD if not repo),
 * values are the symbols which are found in the given file.
 */
export type FileLookup = {
    /** a hash of the last-updated date along with file contents */
    baseHash: number;
    /**
     * a hash of just the content (and with surrounding whitespace removed)
     */
    trimmedHash: number;
    /**
     * a map of the symbol's name to the hash value (as last measured)
     */
    symbols: ReadonlyMap<string, number>;
}



/**
 * cached metadata for source files
 */
export type FileMeta = {
    __kind: "FileMeta";
    /** A reference to this `FileMeta` in the files cache */
    fileRef: FileRef;

    /**
     * Symbols _imported_ by the file. This includes both internal
     * imports from the current project and external dependencies.
     */
    imports: SymbolImport[];

    /**
     * Symbols _defined_ in the file. This includes types, interfaces,
     * classes and other exported symbols.
     */
    symbols: SymbolRef[];

    /**
     * TypeScript compiler diagnostics found in the file.
     * Includes errors, warnings and suggestions.
     */
    diagnostics: DiagRef[];

    /**
     * A hash which detects whether the symbol's imported
     * have changed. Ordering, whitespace, and other aspects
     * are ignored.
     */
    importsHash: number;
    /**
     * A hash which detects whether the symbols which are 
     * _defined_ on the page have changed but **not** whether
     * the definition itself has changed.
     */
    symbolsHash: number;
    /**
     * A hash which detects change in the diagnostic status
     * of this file.
     */
    diagnosticsHash: number;

    /**
     * A hash which detects whether any of the other hashes
     * (besides `fileContentHash`) have changed.
     */
    fileHash: number;

    /**
     * helps to detect whether the textual content -- with edge 
     * whitespace trimmed -- has changed.
     */
    fileContentHash: number;
}

