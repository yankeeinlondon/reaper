import { isObject } from "inferred-types";
import { Node } from "ts-morph";

/** 
 * type guard which validates that the type provided 
 * is a **ts-node** `Node` 
 */
export function isNode(val: unknown): val is Node {
    return (
        isObject(val) &&
        typeof val.getKind === "function" &&
        typeof val.getSourceFile === "function"
    );
}
