import { Diagnostic, SourceFile } from "ts-morph";
import { isSourceFile } from "~/type-guards";
import { isFileRef } from "~/type-guards/isFileRef";
import { FileMeta, FileRef } from "~/types";
import { getFilePath } from "./getFilePath";
import { asFileRef } from "./file-cache";

/**
 * gets a `FileRef` from:
 * 
 * - `SourceFile`,
 * - `FileRef`,
 * - `FileMeta`,
 * - or `Diagnostic`
 */
export function getFileReference(
    source: SourceFile | FileRef | FileMeta | Diagnostic 
): FileRef {
    
    if(isFileRef(source)) {
        return source;
    } else {
        const filePath = getFilePath(source);
        const fileRef = asFileRef(filePath);

        return fileRef;
    }
}
