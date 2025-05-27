import type { SourceFile } from "ts-morph";
import type { FilesApi } from "~/types";
import { wrapFn } from "~/utils";

export function provideFilesApi(files: SourceFile[]): FilesApi {
    const summary = files.map(
        f => ({
            filepath: f.getFilePath(),
            baseName: f.getBaseName(),
            lines: f.getEndLineNumber(),
            /** get the full text of the file */
            getText: f.getText,
            /** get the export symbols for the file */
            getExportSymbols: wrapFn(
                f.getExportSymbols,
                (fn, args) => {
                    const symbols = fn(...args);
                    (symbols);
                },
            ),
            getImports: f.getImportDeclarations,

        }),
    );
    const fn = () => summary;
    const kv = {
        toString() {
            return "";
        },
        toJSON() {
            return "";
        },
        toConsole() {

        },
    };
    return createFnWithProps(fn, kv);
}
