import type { FileRef } from "~/types";
import { isString } from "inferred-types";

/**
 * type guard which validates that `val` is a `FileRef`
 */
export function isFileRef(val: unknown): val is FileRef {
    return isString(val) && val.startsWith("file-ref::");
}
