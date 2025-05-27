import type { Diagnostic } from "ts-morph";
import { asFileRef, getFilePath } from "~/ast";

export function createDiagnosticRef(diag: Diagnostic) {
    const fileRef = asFileRef(getFilePath(diag));
    const file = hasFile(fileRef);

    const filePath = getFilePath(fileRef);
}
