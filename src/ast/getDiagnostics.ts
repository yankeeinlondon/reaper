import { isString } from "inferred-types";
import { relative } from "node:path";
import { Diagnostic, SourceFile, ts } from "ts-morph";
import { isSourceFile, isTsDiagnostic } from "~/type-guards";
import { FileDiagnostic } from "~/types";
import { ROOT } from "~/constants"
import { DiagnosticError } from "~/errors";


/**
 * **asFileDiagnostic**`(diag)`
 * 
 * Takes a `Diagnostic` from **ts-morph** and summarizes to 
 * a _serializable_ `FileDiagnostic`.
 */
function asFileDiagnostic(
    diagnostic: Diagnostic<ts.Diagnostic>
): FileDiagnostic {

    const code = isTsDiagnostic(diagnostic)
        ? diagnostic.code
        : diagnostic.getCode();

    const msg = isTsDiagnostic(diagnostic)
        ? isString(diagnostic.messageText) 
            ? diagnostic.messageText 
            : "getMessageText" in diagnostic && typeof diagnostic.getMessageText === "function" 
                ? String(diagnostic.getMessageText())
                : "UNKNOWN"
        : String(diagnostic.getMessageText());


    const category = isTsDiagnostic(diagnostic)
        ? diagnostic.category
        : diagnostic.getCategory();

    const start = isTsDiagnostic(diagnostic) 
        ? diagnostic.start 
        : diagnostic.getStart();
    const length = isTsDiagnostic(diagnostic) 
        ? diagnostic.length 
        : diagnostic.getLength();
    const { line, character } = isTsDiagnostic(diagnostic)
        ? { line: start || 0, character: length || 0 }
        : ts.getLineAndCharacterOfPosition(
            (diagnostic.getSourceFile() as SourceFile).compilerNode,
            diagnostic.getStart() || 0
        );
    const filepath = isTsDiagnostic(diagnostic)
        ? diagnostic.file?.fileName
        : diagnostic.getSourceFile()?.getFilePath();

    const payload =  {
        code,
        msg,
        category,
        filepath: filepath 
            ? relative(ROOT, filepath) : undefined,
        loc: {
            lineNumber: line + 1,
            column: character + 1,
            start,
            length
        }
    } satisfies Omit<FileDiagnostic, "toError">;

    return {
        ...payload,
        toError() {
            return DiagnosticError(msg, { code, filepath, loc: payload.loc })
        }
    }
}


/**
 * Converts raw `Diagnostic` data to `FileDiagnostic` data
 * which provides additional context based on `SourceFile`
 * information.
 */
export function getFileDiagnostics(
    files: SourceFile[] | Diagnostic[]
): FileDiagnostic[] {
    const diagnostics: FileDiagnostic[] = [];

    if (files.length === 0) {
        return []
    } else if ( isSourceFile(files[0]) ) {
        for (const file of (files as SourceFile[])) {
            const diag = file.getPreEmitDiagnostics();
            const fd = diag.map(d => asFileDiagnostic(d));
            diagnostics.push(...fd);
        }
    } else {
        const diag = files as Diagnostic[];
        for (const d of diag) {
            diagnostics.push(asFileDiagnostic(d))
        }
    }

    return diagnostics;
}

/**
 * Get diagnostics for the source files passed in.
 */
export function getDiagnostics(
    files: SourceFile[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (const file of files) {
        const diag = file.getPreEmitDiagnostics();
        diagnostics.push(...diag);
    }

    return diagnostics;
}
