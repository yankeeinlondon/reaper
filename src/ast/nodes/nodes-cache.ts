import type { Node, Symbol } from "ts-morph";
import { isSymbol } from "inferred-types";
import { InvalidNodeRef } from "~/errors";

const NODES = new WeakMap<Node, Symbol>();

/**
 * Checks whether the `Node` lookup cache has an entry for the
 * passed in `Node`.
 *
 * **Related:** `addNode()`, `lookupNode()`
 */
export function hasNode(node: Node): boolean {
    return NODES.has(node);
}

/**
 * adds a `Node` to the cache if it can be converted to a Symbol.
 *
 * - returns the `Symbol` when able to resolve to a Symbol
 * - returns _undefined_ otherwise
 *
 * **Note:** it will **use** the cache for resolution (if that's an
 * option) unless the optional `force` parameter is set to `true`.
 *
 * **Related:** `hasNode()`, `lookupNode()`
 */
export function addNode(
    node: Node,
    force: boolean = false,
): Symbol | undefined {
    if (NODES.has(node) && !force) {
        return NODES.get(node);
    }
    const sym = node.getSymbol();
    if (isSymbol(sym)) {
        NODES.set(node, sym);
        return sym;
    }

    return undefined;
}

/**
 * returns the cached `Symbol` if it exists or throws
 * `InvalidNodeRef` error.
 *
 * **Related:** `hasNode()`, `addNode()`
 */
export function lookupNode(node: Node): Symbol {
    if (NODES.has(node)) {
        return NODES.get(node) as Symbol;
    }
    else {
        throw InvalidNodeRef(`A non-cached Node was passed to lookupNode()! To avoid this error consider calling hasNode() first.`, { node });
    }
}
