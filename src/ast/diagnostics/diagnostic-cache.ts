import { Diagnostic } from "ts-morph";
import { DiagRef, FileDiagnostic } from "~/types";

/**
 * Cache store for Diagnostics metadata
 */
const DIAG = new Map<DiagRef, FileDiagnostic>;



export function hasDiagnostic(ref: DiagRef): boolean {
    return DIAG.has(ref);
}

export function addDiagnosticToCache(diag: Diagnostic) {
    const ref = createDiagnosticRef(diag);
    
}
