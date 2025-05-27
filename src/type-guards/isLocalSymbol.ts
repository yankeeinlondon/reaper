import type { LocalSymbol } from "~/types/cache-types";
import { isString } from "inferred-types";

/**
 * type guard which detects leading `local::` and corrects type to
 * be a `LocalSymbol` representation.
 */
export function isLocalSymbol(val: unknown): val is LocalSymbol {
    return isString(val) && val.startsWith("local::");
}
