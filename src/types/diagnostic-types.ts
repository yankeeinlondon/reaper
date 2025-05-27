import type { FileMeta } from "./file-types";
import type { DIAG_REF_PREFIX } from "~/constants";
import type { DiagnosticError } from "~/errors";

type FilePath = string;
type Hash = string;

export type DiagnosticLevel =
    | "warning"
    | "error"
    | "suggestion"
    | "message";

/**
 * a _reference_ to a `FileDiagnostic` in cache
 */
export type DiagRef = `${typeof DIAG_REF_PREFIX}${FilePath}::${Hash}`;

export interface FileDiagnostic {
    ref: DiagRef;
    /** relative filepath to the file from repo root */
    filepath: string;
    getFileMeta: () => FileMeta;

    /** the TS Error code */
    code: number;
    /**
     * - `warning`,
     * - `error`,
     * - `suggestion`
     * - or `message`
     */
    level: DiagnosticLevel;
    /** the error message */
    msg: string;
    loc: {
        lineNumber: number;
        column: number;
        start: number | undefined;
        length: number | undefined;
    };

    toError: () => typeof DiagnosticError["errorType"];
    toString: () => string;
    toJSON: () => string;
}
