import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "repo-root";
import { getRoot } from "~/constants";

/**
 * Reads the .gitignore in the repo's root folder:
 *
 * - comment lines are removed
 * - you can _optionally_ specify a directory but if you do
 * it will then use that as a starting point for detecting
 * a repo root directory
 * - by default the search for a root directory starts with
 * the current working directory
 * - if no `.gitignore` file is found an empty array is returned.
 */
export function getGitignore(dir?: string): string[] {
    let root: string;
    if (dir) {
        try {
            root = repoRoot(dir);
        }
        catch {
            root = dir;
        }
    }
    else {
        root = getRoot();
    }
    const ignoreFile = join(root, ".gitignore");

    if (existsSync(ignoreFile)) {
        const content = readFileSync(ignoreFile, "utf-8");

        return content
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line =>
                line !== "" && !line.startsWith("#"),
            )
            .map(line =>
                line.startsWith("\\#") ? line.slice(1) : line,
            );
    }

    return [];
}
