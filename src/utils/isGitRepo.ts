import type { SimpleGit } from "simple-git";
import simpleGit from "simple-git";
import { getRoot, MAX_CONCURRENT_PROCESSES } from "~/constants";
import { repoRoot } from "./repoRoot";

/**
 * Checks if current directory is part of a repo and if it
 * is then returns an instance of `SimpleGit`, otherwise returns
 * `false`.
 */
export async function isGitRepo(filepath?: string): Promise<SimpleGit | false> {
    const git = simpleGit(
        filepath ? repoRoot(filepath) : getRoot(),
        {
            maxConcurrentProcesses: MAX_CONCURRENT_PROCESSES,
        },
    );

    const isRepo = await git.checkIsRepo();

    return isRepo ? git : false;
}
