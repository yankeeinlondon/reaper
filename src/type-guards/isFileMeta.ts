import type { FileMeta } from "~/types";
import { isObject } from "inferred-types";
import { isFileRef } from "./isFileRef";

export function isFileMeta(val: unknown): val is FileMeta {
    return isObject(val)
      && "fileRef" in val
      && isFileRef(val.fileRef)
      && "__kind" in val
      && val.__kind === "FileMeta";
}
