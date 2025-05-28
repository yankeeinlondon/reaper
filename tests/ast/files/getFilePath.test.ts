import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { getFilePath } from "~/ast/files/getFilePath";
import { InvalidFilepath } from "~/errors";
import { isFileRef } from "~/type-guards/isFileRef";

const project = new Project({ useInMemoryFileSystem: true });
const file = project.createSourceFile(
    "foo/bar.ts", 
    "export const x = 1; export type T = string;"
);
const filePath = file.getFilePath();

// Simulate FileRef and FileMeta
const fileRef = 'file-ref::foo/bar.ts' as const;
const fileMeta = {
    __kind: "FileMeta" as const,
    fileRef,
    imports: [],
    symbols: [],
    diagnostics: [],
    importsHash: 0,
    symbolsHash: 0,
    diagnosticsHash: 0,
    fileHash: 0,
    fileContentHash: 0,
};

// Get a symbol and a node
const symbol = file.getExportSymbols()[0];
const node = file.getVariableDeclarations()[0];

describe("getFilePath()", () => {
    it("resolves from SourceFile", () => {
        expect(getFilePath(file)).toBe(filePath);
    });
    it("resolves from FileRef", () => {
        expect(getFilePath(fileRef)).toMatch(/foo\/bar\.ts$/);
    });
    it("resolves from FileMeta", () => {
        expect(getFilePath(fileMeta)).toMatch(/foo\/bar\.ts$/);
    });
    it("resolves from Symbol", () => {
        expect(getFilePath(symbol)).toMatch(/foo\/bar\.ts$/);
    });
    it("resolves from Node", () => {
        const result = getFilePath(node);
        expect(typeof result).toBe("string");
        expect(result.endsWith("foo/bar.ts")).toBe(true);
    });
    // Skipping Diagnostic test: not easily creatable in-memory with ts-morph
    it("throws on invalid input", () => {
        expect(() => getFilePath(123 as any)).toThrow();
    });
});
