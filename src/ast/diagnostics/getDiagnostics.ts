import { isString, Never } from "inferred-types";
import { Diagnostic, DiagnosticCategory, SourceFile, ts } from "ts-morph";
import { isSourceFile, isTsDiagnostic } from "~/type-guards";
import { DiagnosticLevel, FileDiagnostic } from "~/types";
import { DiagnosticError, InvalidFilepath } from "~/errors";
import { asFileRef } from "../files";
import { displayDiagnostic, displayFile } from "~/report";


/**
 * **asFileDiagnostic**`(diag)`
 * 
 * Takes a `Diagnostic` from **ts-morph** and summarizes to 
 * a _serializable_ `FileDiagnostic`.
 */
function asFileDiagnostic(
    diagnostic: Diagnostic<ts.Diagnostic>,
    opts: { filepath?: string } = {}
): FileDiagnostic {
    const filepath = opts.filepath || diagnostic.getSourceFile()?.getFilePath().toString();

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


    if(!filepath) {
        throw InvalidFilepath(`Unresolvable filepath in diagnostic passed to asFileDiagnostic()`, { diagnostic: msg, code });
    }


    const category = isTsDiagnostic(diagnostic)
        ? diagnostic.category
        : diagnostic.getCategory();
    const level: DiagnosticLevel = category === DiagnosticCategory.Error
        ? "error"
        : category === DiagnosticCategory.Warning
            ? "warning"
            : category === DiagnosticCategory.Suggestion
                ? "suggestion"
                : category === DiagnosticCategory.Message
                    ? "message"
                    : Never

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

    const payload: FileDiagnostic = {
        code,
        msg,
        level,
        fileRef: asFileRef(filepath),
        loc: {
            lineNumber: line + 1,
            column: character + 1,
            start,
            length
        },
        toString() {
            return displayDiagnostic(this, { format: "text"})
        },
        toConsole() {
            return displayDiagnostic(this, {format: "console"})
        },
        toJSON() {
            return JSON.stringify(this);
        },
        toError() {
            return DiagnosticError(msg, { filepath, level, code })
        }
    };

    return payload
};





/**
 * Takes raw `Diagnostic` data to `FileDiagnostic` data
 * which provides additional context based on `SourceFile`
 * information.
 */
export function getFileDiagnostics(
    files: SourceFile[] | Diagnostic[]
): FileDiagnostic[] {
    const diagnostics: FileDiagnostic[] = [];

    if (files.length === 0) {
        return []
    } else if (isSourceFile(files[0])) {
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
