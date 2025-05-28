import type { Diagnostic, Node, SourceFile, Symbol } from "ts-morph";
import type { FileMeta, FileRef } from "~/types";
import { isString } from "inferred-types";
import { InvalidFilepath } from "~/errors";
import {
    isDiagnostic,
    isFileMeta,
    isSourceFile,
    isSymbol,
    isFileRef,
    isNode
} from "~/type-guards";
import { addNode, hasNode, lookupNode } from "../nodes";
import { extractFileRef } from "~/ast/files";

/**
 * takes a:
 *   - `FileRef`
 *   - `SourceFile`,
 *   - `Node`,
 *   - or `Diagnostic`
 *
 * and returns a string filepath.
 *
 *  - if filepath is not resolvable throws `InvalidFilepath`
 */
export function getFilePath(
    source: FileRef | FileMeta | Symbol | SourceFile | Node | Diagnostic,
) {
    if (isSourceFile(source)) {
        const attempt = source.getFilePath().toString();
        if (isString(attempt)) {
            return attempt;
        }
        else {
            throw InvalidFilepath(`Unable to resolve filepath from a SourceFile!`, { sourceFile: source });
        }
    }
    else if (isFileMeta(source)) {
        return extractFileRef(
            source.fileRef,
        );
    }
    else if (isDiagnostic(source)) {
        const attempt = source.getSourceFile();
        if (isSourceFile(attempt)) {
            return getFilePath(attempt);
        }
        throw InvalidFilepath(`Unable to resolve the filepath from the passed in Diagnostic!`);
    }
    else if (isSymbol(source)) {
        const attempt = source
            .getDeclarations()[0].getSourceFile()?.getFilePath()?.toString();
        if (isString(attempt)) {
            return attempt;
        }

        throw InvalidFilepath(
            `failed to get filepath from the passed in symbol!`
        );
    }
    else if (isFileRef(source)) {
        return extractFileRef(source);
    }
    else if (isNode(source)) {
        if (hasNode(source)) {
            const s = lookupNode(source);
            if (isSymbol(s)) {
                return getFilePath(s);
            } else {
                let a: Symbol | undefined;
                try {
                    a = addNode(source);
                    if (isSymbol(a)) {
                        return getFilePath(a);
                    } else {
                        throw InvalidFilepath(
                            `the Node passed to getFilePath() was not found in the cache and failed to enter the cache when attempted!`,
                            { reason: `unable to convert Node to Symbol` }
                        )
                    }
                } catch { }

                throw InvalidFilepath(
                    `the Node passed to getFilePath() was not found in the cache and failed to enter the cache when attempted!`,
                    { 
                        reason: `unable to convert Node to Symbol during call to addNode()` 
                    }
                )
            }
        }

        throw InvalidFilepath(
            `the Node passed into getFilePath() was not in the cache. Consider pushing it into the cache before calling.`,
            {
                reason: "the Node passed to getFilePath() wasn't in the cache and an error occurred trying to add it!"
            }
        );
    }

    else {
        throw InvalidFilepath(
            `the addFilePath() function was called with an unexpected type passed in!`,
            { 
                source: typeof source,
                reason: "unknown parameter type passed in as source!"
            }
        );
    }
}
