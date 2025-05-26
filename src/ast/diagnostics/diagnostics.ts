import { isArray, isString, ObjectKey } from "inferred-types";
import { SourceFile } from "ts-morph";
import { isSourceFile } from "src/type-guards";
import { FileDiagnostic } from "~/types";
import { getFileDiagnostics } from "./getDiagnostics";

export type BlockType = {
    startLine: number;
    endLine: number;
    [key: ObjectKey]: unknown
}




/**
 * Get the diagnostics for a page and then the isolates only those
 * between a start and end line number.
 */
export const getDiagnosticsBetweenLines = (
    input: SourceFile | FileDiagnostic[],
    startingAt: number,
    endingAt: number,
) => {
    const diag = isSourceFile(input)
        ? getFileDiagnostics(input)
        : input;

    return diag.filter(
        d => d.loc.lineNumber >= startingAt 
            && d.loc.lineNumber <= endingAt
    )
}


const notContainedBy = (...blocks: BlockType[]) => (d: FileDiagnostic) => {
    return !blocks.some(b => d.loc.lineNumber >= b.startLine && d.loc.lineNumber <= b.endLine)
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
export const getDiagnosticsOutsideBlocks = (
    input: SourceFile | FileDiagnostic[],
    ...blocks: BlockType[]
): FileDiagnostic[] => {

    return isString(input) || isSourceFile(input)
        ? getFileDiagnostics(input)
            .filter(notContainedBy(...blocks))
        : isArray(input)
            ? input.filter(notContainedBy(...blocks))
            : []
}


