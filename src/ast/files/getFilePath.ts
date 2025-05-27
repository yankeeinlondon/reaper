import type { Diagnostic, Node, SourceFile, Symbol } from "ts-morph";
import type { FileMeta, FileRef } from "~/types";
import { isString } from "inferred-types";
import { InvalidFilepath } from "~/errors";
import {
    isDiagnostic,
    isFileMeta,
    isSourceFile,
    isSymbol,
} from "~/type-guards";
import { isFileRef } from "~/type-guards/isFileRef";
import { addNode, hasNode, lookupNode } from "../nodes";
import { extractFileRef } from "./file-cache";

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
        const attempt = source.getSourceFile()?.getFilePath().toString();
        if (isString(attempt)) {
            return attempt;
        }
        else {
            throw InvalidFilepath(`Unable to resolve filepath from a Diagnostic!`, { diagnostic: source });
        }
    }
    else if (isSymbol(source)) {
        const attempt = source.getDeclarations()[0].getSourceFile().getFilePath().toString();

        return attempt;
    }
    else if (isFileRef(source)) {
        return extractFileRef(source);
    }

    else {
        if (hasNode(source)) {
            return getFilePath(lookupNode(source) as Symbol);
        }
        const attempt = addNode(source);
        if (isSymbol(attempt)) {
            return getFilePath(attempt);
        }
        else {
            throw InvalidFilepath(``, { node: source });
        }
    }
}
