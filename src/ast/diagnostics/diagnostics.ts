import type { ObjectKey } from "inferred-types";
import type { SourceFile } from "ts-morph";
import type { FileDiagnostic } from "~/types";
import { isArray, isString } from "inferred-types";
import { isSourceFile } from "src/type-guards";
import { getFileDiagnostics } from "./getDiagnostics";

export interface BlockType {
    startLine: number;
    endLine: number;
    [key: ObjectKey]: unknown;
}

/**
 * Get the diagnostics for a page and then the isolates only those
 * between a start and end line number.
 */
export function getDiagnosticsBetweenLines(input: SourceFile | FileDiagnostic[], startingAt: number, endingAt: number) {
    const diag = isSourceFile(input)
        ? getFileDiagnostics(input)
        : input;

    return diag.filter(
        d => d.loc.lineNumber >= startingAt
        && d.loc.lineNumber <= endingAt,
    );
}

function notContainedBy(...blocks: BlockType[]) {
    return (d: FileDiagnostic) => {
        return !blocks.some(b => d.loc.lineNumber >= b.startLine && d.loc.lineNumber <= b.endLine);
    };
}

/**
 * **getErrorsOutsideBlocks**`(file, ...blocks)`
 *
 * Returns the diagnostics which **are not** contained by the
 * passed in block elements.
 *
 * **Note:** a "block element" is any dictionary based object with
 * keys of `startLine` and `endLine`.
 */
export function getDiagnosticsOutsideBlocks(input: SourceFile | FileDiagnostic[], ...blocks: BlockType[]): FileDiagnostic[] {
    return isString(input) || isSourceFile(input)
        ? getFileDiagnostics(input)
            .filter(notContainedBy(...blocks))
        : isArray(input)
            ? input.filter(notContainedBy(...blocks))
            : [];
}
