import type { Diagnostic, SourceFile } from "ts-morph";
import type { FileMeta, FileRef } from "~/types";
import { isFileRef } from "~/type-guards/isFileRef";
import { asFileRef } from "./file-cache";
import { getFilePath } from "./getFilePath";

/**
 * gets a `FileRef` from:
 *
 * - `SourceFile`,
 * - `FileRef`,
 * - `FileMeta`,
 * - or `Diagnostic`
 */
export function getFileReference(
    source: SourceFile | FileRef | FileMeta | Diagnostic,
): FileRef {
    if (isFileRef(source)) {
        return source;
    }
    else {
        const filePath = getFilePath(source);
        const fileRef = asFileRef(filePath);

        return fileRef;
    }
}
