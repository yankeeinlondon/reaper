import { isArray, isString, ObjectKey } from "inferred-types";
import { SourceFile } from "ts-morph";
import { getFileDiagnostics } from "./files";
import { FileDiagnostic } from "../types/file-ast-types";
import { isSourceFile } from "src/type-guards";
import { TestFile } from "../types/testing-types";

export type BlockType = {
    startLine: number;
    endLine: number;
    [key: ObjectKey]: unknown
}


export const getErrorDiagnostics = (
    input: SourceFile | FileDiagnostic[],
    ...ignore: number[]
) => {
    const diag: FileDiagnostic[] = isSourceFile(input)
            ? getFileDiagnostics(input)
            : input;

    return diag.filter(d => !ignore.includes(d.code))
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


export const hasDiagnostics = (file: TestFile | SourceFile): boolean => {
    if (isSourceFile(file)) {
        const d = file.getPreEmitDiagnostics();
        return d.length > 0
    } else {
        return file.blocks.flatMap(b => b.diagnostics).length > 0
    }
}
