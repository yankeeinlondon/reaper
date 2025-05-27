import { describe, it, expect, beforeAll } from "vitest";
import { Project, SourceFile } from "ts-morph";
import { getFileImports, ImportSymbol } from "~/ast/files/getFileImports";
import { isSymbol } from "~/type-guards";

const sourceText = `
// runtime imports
import { foo, bar } from './other';
import Baz from './other';
import * as All from './other';
import { E } from './other'; // enum
// type-only imports
import type { FooType } from './other';
// implicit type import
import { BarType } from './other';
// mixed
const notImported = 42;
`;
const otherSourceText = `
export const foo = 1;
export function bar() {}
export default class Baz {}
export enum E { A, B }
export type FooType = string;
export interface BarType { x: number; }
`;

const project = new Project({ useInMemoryFileSystem: true });

describe("getFileImports()", () => {
    beforeAll(() => {
        project.createSourceFile(
            "other.ts", otherSourceText, { overwrite: true }
        );
        project.createSourceFile(
            "test.ts", sourceText, { overwrite: true }
        );
    });

    
    it("explicit type imports set correctly", () => {
        const file = project.getSourceFile("test.ts") as SourceFile;
        const symbols = getFileImports(file);

        expect(
            symbols.map(i => i.importName).includes("FooType"),
        ).toBe(true);

        const fooType = symbols.find(i => i.importName === "FooType") as ImportSymbol;
        
        expect(
            fooType.typeSpecifier, 
            "FooType does have a type specifier in input"
        ).toBe(true);
        expect(
            fooType.isTypeSymbol, 
            "should be a type symbol"
        ).toBe(true);
        expect(
            isSymbol(fooType.symbol),
            "symbol is recognized as such by type guard",
        ).toBe(true);
        
    });

    it("implicit type imports set correctly", () => {
        const file = project.getSourceFile("test.ts") as SourceFile;
        const symbols = getFileImports(file);

        expect(
            symbols.map(i => i.importName).includes("BarType"),
        ).toBe(true);

        const barType = symbols.find(i => i.importName === "BarType") as ImportSymbol;
        
        expect(
            barType.typeSpecifier, 
            "BarType does not have a type specifier in input"
        ).toBe(false);
        expect(
            barType.isTypeSymbol, 
            "BarType should be a type symbol"
        ).toBe(true);
        expect(
            isSymbol(barType.symbol),
            "BarType symbol is recognized as such by type guard",
        ).toBe(true);
        
    });
    

    it("returns empty array for files with no imports", () => {
        const emptyFile = project.createSourceFile("empty.ts", "const x = 1;", { overwrite: true });
        const symbols = getFileImports(emptyFile);
        expect(symbols).toEqual([]);
    });

    it("correctly sets typeSpecifier and isTypeSymbol for mixed imports", () => {
        const mixedSource = `import { foo } from './other'; import type { BarType } from './other';`;
        const mixedFile = project.createSourceFile("mixed.ts", mixedSource, { overwrite: true });
        const symbols = getFileImports(mixedFile);
        // foo: runtime import
        expect(
            symbols.some(s => s.importName === "foo" && s.typeSpecifier === false && s.isTypeSymbol === false)
        ).toBe(true);
        // BarType: type-only import
        expect(
            symbols.some(s => s.importName === "BarType" && s.typeSpecifier === true && s.isTypeSymbol === true)
        ).toBe(true);
    });
});
