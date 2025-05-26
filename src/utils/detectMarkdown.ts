import FastGlob from "fast-glob";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { getRoot } from "~/constants";
import { repoRoot } from "./repoRoot";

/**
 * Returns a list of markdown documents relative to a
 * repo's root.
 * 
 * - by default the repo's root will be searched from the
 * current working directory
 * - you can manually pass in a directory to override the
 * starting location but it will look for the repo's root
 * from that location
 */
export function detectMarkdown(filepath?: string) {

    const root = filepath ? repoRoot(filepath) : getRoot();
    const globs = [join(root, "**/*.md"), "!node_modules", "!.git", "!jspm_packages","!.cache", "!coverage"];
    // relative paths to all markdown
    const docs = FastGlob.sync(globs).map(i => relative(root, i));
    const README = docs.find(i => i.toLowerCase() === "./readme.md");
    const others = docs.filter(i => i.toLowerCase() !== "./readme.md")

    return {
        /** whether the repo has a README in the root of repo */
        hasReadMe: !!README,
        /**
         * the content of the `README.md` in the root of the repo 
         * (if it exists)
         */
        README: README 
            ? readFileSync(join(root, README), "utf-8")
            : undefined,
        /**
         * Filepaths to all other Markdown content in the repo.
         */
        others
    }
}
