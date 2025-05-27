// Mock dependencies before imports
vi.mock("repo-root", () => ({
    repoRoot: () => "/mock/root"
}));
vi.mock("fast-glob", () => ({
    default: {
        sync: vi.fn()
    }
}));
vi.mock("node:fs", () => ({
    readFileSync: (path: any) => {
        if (typeof path === "string" && path.endsWith("README.md")) return "# Mock README";
        throw new Error("File not found");
    }
}));
vi.mock("node:path", () => ({
    join: (...args: string[]) => args.join("/"),
    normalize: (p: string) => p, // if needed
}));

import { describe, it, expect, vi, afterEach } from "vitest";
import { detectMarkdown } from "~/utils/detectMarkdown";
import * as getGitignoreModule from "~/utils/getGitIgnore";
import FastGlob from "fast-glob";

// Mock getGitignore
vi.spyOn(getGitignoreModule, "getGitignore").mockImplementation(() => []);

// Mock path.join
vi.spyOn(path, "join").mockImplementation((...args: string[]) => args.join("/"));

import * as path from "node:path";

// Mock dependencies before imports
vi.mock("repo-root", () => ({
    repoRoot: () => "/mock/root"
}));
vi.mock("fast-glob", () => ({
    default: {
        sync: vi.fn()
    }
}));
vi.mock("node:fs", () => ({
    readFileSync: (path: any) => {
        if (typeof path === "string" && path.endsWith("README.md")) return "# Mock README";
        throw new Error("File not found");
    }
}));



describe("detectMarkdown()", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("detects README.md in root and no others", () => {
        (FastGlob.sync as any).mockReturnValue(["README.md"]);
        const result = detectMarkdown();
        expect(result.hasReadMe).toBe(true);
        expect(typeof result.README).toBe("function");
        expect(result.others).toEqual([]);
        expect(result.README && result.README()).toBe("# Mock README");
    });

    it("detects README.md and other markdown files", () => {
        (FastGlob.sync as any).mockReturnValue(["README.md", "docs/guide.md", "notes/todo.md"]);
        const result = detectMarkdown();
        expect(result.hasReadMe).toBe(true);
        expect(result.others).toEqual(["docs/guide.md", "notes/todo.md"]);
    });

    it("detects no README.md but other markdown files", () => {
        (FastGlob.sync as any).mockReturnValue(["docs/guide.md", "notes/todo.md"]);
        const result = detectMarkdown();
        expect(result.hasReadMe).toBe(false);
        expect(result.README).toBeUndefined();
        expect(result.others).toEqual(["docs/guide.md", "notes/todo.md"]);
    });

    it("handles case-insensitive README.md", () => {
        (FastGlob.sync as any).mockReturnValue(["ReadMe.MD", "docs/guide.md"]);
        const result = detectMarkdown();
        expect(result.hasReadMe).toBe(true);
        expect(typeof result.README).toBe("function");
        expect(result.others).toEqual(["docs/guide.md"]);
    });

    it("returns empty results if no markdown files found", () => {
        (FastGlob.sync as any).mockReturnValue([]);
        const result = detectMarkdown();
        expect(result.hasReadMe).toBe(false);
        expect(result.README).toBeUndefined();
        expect(result.others).toEqual([]);
    });
});
