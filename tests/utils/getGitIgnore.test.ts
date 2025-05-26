import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { getGitignore } from "~/utils/getGitIgnore";
import { join } from "path";
import {
    writeFileSync,
    unlinkSync,
    existsSync,
    rmdirSync,
} from "fs";
import os from "os";
import { ensureDirExists } from "~/utils/ensureDirExists";

const TEST_DIR = join(os.tmpdir(), `__gitignore_test___${process.pid}`);
const SRC_DIR = join(TEST_DIR, "/src");
const GIT_DIR = join(TEST_DIR, "/.git");

const PACKAGE_FILE = join(TEST_DIR, "package.json");
const GITIGNORE_FILE = join(SRC_DIR, ".gitignore");
const HEAD_FILE = join(GIT_DIR, "./HEAD");
const SRC_FILE = join(TEST_DIR, "/src/index.ts");

function setupTempDir(includePackage?: boolean) {
    ensureDirExists(SRC_DIR);
    ensureDirExists(GIT_DIR);

    if (!existsSync(PACKAGE_FILE)) writeFileSync(PACKAGE_FILE, "{}", "utf-8")
    if (!existsSync(HEAD_FILE)) writeFileSync(HEAD_FILE, "  ", "utf-8")
    if (!existsSync(SRC_FILE)) writeFileSync(SRC_FILE, "export default () => `hi`;\n", "utf-8");
}

function addContent(content: string) {
    writeFileSync(GITIGNORE_FILE, content, "utf-8");
}

function cleanupTempDir() {
    if (existsSync(PACKAGE_FILE)) unlinkSync(PACKAGE_FILE);
    if (existsSync(HEAD_FILE)) unlinkSync(HEAD_FILE);
    if (existsSync(SRC_FILE)) unlinkSync(SRC_FILE);
    if (existsSync(GITIGNORE_FILE)) unlinkSync(GITIGNORE_FILE);

    if (existsSync(GIT_DIR)) rmdirSync(GIT_DIR);
    if (existsSync(SRC_DIR)) rmdirSync(SRC_DIR);
    if (existsSync(TEST_DIR)) rmdirSync(TEST_DIR);
}

describe("getGitignore", () => {

    afterEach(() => {
        cleanupTempDir();
    });
    beforeEach(() => {
        setupTempDir();
    });

    it("returns an empty array if no .gitignore exists (with package.json", () => {
        // No setupGitignore call, so no .gitignore present
        expect(getGitignore(TEST_DIR), `The temp directory -- ${TEST_DIR} has no files in it`).toEqual([]);
    });

    it("returns an empty array if no .gitignore exists (without package.json", () => {
        // No setupGitignore call, so no .gitignore present
        expect(getGitignore(TEST_DIR), `The temp directory -- ${TEST_DIR} has no files in it`).toEqual([]);
    });

    it("parses .gitignore and removes comments and blank lines", () => {
        addContent(`# comment\nnode_modules\n\n# another comment\ndist\n\n\\#notacomment\n`);
        const result = getGitignore(TEST_DIR);
        expect(result).toEqual(["node_modules", "dist", "#notacomment"]);
    });

    it("trims whitespace and ignores lines starting with #", () => {
        addContent(`  # comment\n  foo  \nbar\n   \n#baz\n`);
        const result = getGitignore(TEST_DIR);
        expect(result).toEqual(["foo", "bar"]);
    });

});
