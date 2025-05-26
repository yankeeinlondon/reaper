import { isString } from "inferred-types";
import { FileRef } from "~/types";

/**
 * type guard which validates that `val` is a `FileRef`
 */
export function isFileRef(val: unknown): val is FileRef {
    return isString(val) && val.startsWith("file-ref::");
}
