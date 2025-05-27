import { readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import FastGlob from "fast-glob";
import { repoRoot } from "repo-root";
import { CWD } from "~/constants";
import { IoError } from "~/errors";
import { getGitignore } from "./getGitIgnore";

function getReadme(filepath: string) {
    try {
        const content = readFileSync(filepath, "utf-8");
        return content;
    }
    catch (err) {
        throw IoError.proxy(err as Error);
    }
}

export interface MarkdownDetection {
    /** whether the repo has a README in the root of repo */
    hasReadMe: boolean;
    /**
     * The content of the `README.md` in the root of the repo
     * (if it exists).
     *
     * - if README does exist it is wrapped as a function call
     * to avoid unnecessay IO unless the contents are needed
     * - also, if
     */
    README: undefined | (() => string);
    /**
     * Filepaths to all other Markdown content in the repo.
     */
    others: readonly string[];
}

/**
 * Returns a list of markdown documents relative to a
 * repo's root.
 *
 * - by default the repo's root will be searched from the
 * current working directory
 * - you can manually pass in a directory to override the
 * starting location but it will look for the repo's root
 * from _that_ location
 */
export function detectMarkdown(filepath?: string): MarkdownDetection {
    const root = filepath ? repoRoot(filepath) : repoRoot(CWD);
    const gitIgnore = getGitignore(filepath);
    const globs = [
        "**/*.md",
        "!**node_modules/**",
        "!**.git/**",
        "!**jspm_packages/**",
        "!**.cache/**",
        "!**coverage/**",
        ...gitIgnore.map(i => `!${i}`),
    ];
    const normalizePath = (p: string) => normalize(p).replace(/^\.\/+/, "").toLowerCase();

    // relative paths to all markdown
    const md = FastGlob.sync(globs, { cwd: root });

    // treat root README separately from other Markdown content
    const README = md.find(i => normalizePath(i) === "readme.md");
    const others = md.filter(i => normalizePath(i) !== "readme.md");

    return {
        hasReadMe: !!README,

        README: README
            ? () => getReadme(join(root, README))
            : undefined,

        others,
    } as MarkdownDetection;
}
