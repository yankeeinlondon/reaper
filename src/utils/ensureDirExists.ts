import { existsSync, mkdirSync } from "node:fs";
import { basename, dirname, extname } from "node:path";

/**
 * Takes a file or directory path as input and then _ensures_ that
 * the directory exists at the path.
 *
 * - in order to do this we will assume that if last "segment"
 * of the path has a `${string}.${ext}` pattern that it is intended
 * to represent a filename where:
 *      - the extension exists (aka., "." in last segment)
 *      - there is at least some string value _before_ the extension
 *          is found
 *
 * This means:
 *
 * - `/foo/bar/.baz` is seen as a directory only, but
 * - `/foo/bar/baz.doc` is seen as the directory `/foo/bar` followed by the file `baz.doc`
 */
export function ensureDirExists(filePath: string) {
    const ext = extname(filePath);
    const base = basename(filePath);
    const endsWithFile = ext && ext !== base;

    const dir = endsWithFile
        ? dirname(filePath)
        : filePath;

    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
}
