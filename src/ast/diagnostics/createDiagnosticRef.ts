import { relative } from "node:path";
import { Diagnostic } from "ts-morph";
import { asFileRef, getFile, getFilePath } from "~/ast";
import { getRoot } from "~/constants";



export function createDiagnosticRef(diag: Diagnostic) {
    const fileRef = asFileRef(getFilePath(diag));
    const file = hasFile(fileRef);

    const filePath = getFilePath(fileRef);
    
    

}
