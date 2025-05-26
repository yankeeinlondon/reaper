import FastGlob from "fast-glob";
import { ensureLeading, IsArray, isArray, isString, stripLeading } from "inferred-types";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { Diagnostic, Project, SourceFile } from "ts-morph";
import { getRoot, FILE_REF_PREFIX } from "~/constants";
import { InvalidFilepath, InvalidFileRef } from "~/errors";
import { ReaperOpts } from "~/lib";
import { isSourceFile } from "~/type-guards";
import { isFileRef } from "~/type-guards/isFileRef";
import { FileMeta, FileRef } from "~/types";
import { getFileReference } from "./getFileReference";

/** 
 * in-memory store for source files
 */
let SOURCE_FILES: SourceFile[] = [];

export function initializeSourceFiles(
    project: Project,
    opts: ReaperOpts = {}
) {
    if(opts.sourceFiles) {
        FastGlob.sync(opts.sourceFiles).map(i => {
            const file = project.getSourceFile(i);
            if(file) {
                SOURCE_FILES.push(file);
            }
        })
    } else {
        SOURCE_FILES = project.getSourceFiles();
    }
}

/**
 * cache of `FileMeta` data, use a `FileRef` to lookup
 * the metadata.
 */
const FILES = new Map<FileRef, FileMeta>;

/**
 * extracts the _absolute path_ of the relative filepath stored in
 * the `FileRef`.
 */
export function extractFileRef(ref: FileRef) {
    return join(getRoot, stripLeading(ref, FILE_REF_PREFIX));
}

/**
 * Returns boolean value indicating whether the given file
 * reference has been cached.
 */
export function hasFile(file: FileRef): boolean {
    return FILES.has(file);
}

/**
 * Ensures that the `FileRef` (or a string 
 * points to a valid file.
 * 
 * - **Note:** the `isFileRef()` function is a type guard and
 * just validates that the structure of the variable is valid.
 */
export function isValidFileRef(
    ref: FileRef | string
): boolean {
    if(isFileRef(ref)) {
        if (!existsSync(extractFileRef(ref))) {
            return false    
        }
    } else {
        const makeRef = ensureLeading(
            relative(
                getRoot(), 
                stripLeading(ref, FILE_REF_PREFIX)
            ),
            FILE_REF_PREFIX
        ) as FileRef;

        return isValidFileRef(makeRef);
    }

    return true
}

/**
 * Takes an absolute or relative path and makes it into
 * a `FileRef` (aka, a relative path from the repo's root prefixed
 * by a prefix).
 * 
 * - **Note:** if the path passed in can not be made into a valid
 * path to a file then a `InvalidFilepath` error will be thrown.
 */
export function asFileRef(filepath: string | Diagnostic): FileRef {
    if (isString(filepath)) {        
        const ref = ensureLeading(
            relative(
                getRoot(), 
                stripLeading(filepath, FILE_REF_PREFIX)
            ),
            FILE_REF_PREFIX
        ) as FileRef;
    
        if (!isValidFileRef(ref)) {
            throw InvalidFilepath(`In call to asFileRef() the "${filepath}" filepath is an invalid to make into a FileRef!`, { filepath, ref, absolute: extractFileRef(ref) })
        }

        return ref;
    } else {
        const p = filepath.getSourceFile()?.getFilePath().toString();
        if(p) {
            return asFileRef(p);
        } else {
            throw InvalidFilepath(`A diagnostic was passed into asFileRef() which could not be resolved to a FileRef`,
                { diagnostic: filepath }
            )
        }
    }
}


/**
 * Adds a `SourceFile` or an array of `SourceFile`'s to the cache 
 * and returns the `FileMeta` for the file(s).
 */
export function addFilesToCache<
    T extends SourceFile | SourceFile[]
>(
    files: T
) {
    const interable = (
        isArray(files) ? files : [files]
    ) as SourceFile[];
    const meta: FileMeta[] = [];

    for (const f of interable) {
        const filepath = f.getFilePath();
        const ref = asFileRef
    }

    return (
        isArray(files)
            ? meta
            : meta[0]
    ) as IsArray<T> extends true ? FileMeta : FileMeta[]
}

/**
 * Takes either a `FileRef` or a `SourceFile` and returns 
 * a `FileMeta` from cache.
 * 
 * - will throw a `InvalidFileRef` if the file was not in the
 * cache
 * 
 * **Related:** `isFileRef()`, `asFileRef()`, `refreshFile()`
 */
export function getFile(
    ref: FileRef | SourceFile | Diagnostic
): FileMeta {
    if (isFileRef(ref)) {
        if (FILES.has(ref)) {
            return FILES.get(ref) as FileMeta;
        } else {
            throw InvalidFileRef(`an FileRef was passed in which was NOT in the cache! Consider using hasFile() call first.`, {
                ref
            })
        }
    } else  {
        const fileRef = getFileReference(ref);
        return getFile(fileRef);
    } 
}
