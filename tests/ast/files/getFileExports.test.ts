import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { getFileExports } from "~/ast/files/getFileExports";

const sourceText = `
// runtime exports
export const foo = 1;
export function bar() {}
export class Baz {}
export enum E { A, B }
// type exports
export type FooType = string;
export interface BarType { x: number; }
// mixed
const notExported = 42;
`;

describe("getFileExports()", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const file = project.createSourceFile("test.ts", sourceText, { overwrite: true });

    it("returns only runtime exports for 'runtime' scope", () => {
        const result = getFileExports(file, "runtime", {});
        const names = result.map(s => s.getName());
        expect(names).toContain("foo");
        expect(names).toContain("bar");
        expect(names).toContain("Baz");
        expect(names).toContain("E"); // Enum should be in runtime
        expect(names).not.toContain("FooType");
        expect(names).not.toContain("BarType");
    });

    it("returns only type exports for 'types' scope", () => {
        const result = getFileExports(file, "types", {});
        const names = result.map(s => s.getName());
        expect(names).toContain("FooType");
        expect(names).toContain("BarType");
        expect(names).not.toContain("foo");
        expect(names).not.toContain("bar");
        expect(names).not.toContain("Baz");
        expect(names).not.toContain("E"); // Enum should NOT be in types
    });

    it("returns both runtime and type exports for 'both' scope", () => {
        const result = getFileExports(file, "both", {});
        const runtimeNames = result.runtime.map(s => s.getName());
        const typeNames = result.types.map(s => s.getName());
        expect(runtimeNames).toContain("foo");
        expect(runtimeNames).toContain("bar");
        expect(runtimeNames).toContain("Baz");
        expect(runtimeNames).toContain("E"); // Enum should be in runtime
        expect(typeNames).toContain("FooType");
        expect(typeNames).toContain("BarType");
        expect(typeNames).not.toContain("E"); // Enum should NOT be in types
    });

    it("returns empty array for files with no exports", () => {
        const emptyFile = project.createSourceFile("empty.ts", "const x = 1;", { overwrite: true });
        expect(getFileExports(emptyFile, "runtime", {})).toEqual([]);
        expect(getFileExports(emptyFile, "types", {})).toEqual([]);
        expect(getFileExports(emptyFile, "both", {})).toEqual({ runtime: [], types: [] });
    });
});
