import simpleGit, { SimpleGit } from "simple-git";
import { MAX_CONCURRENT_PROCESSES, getRoot } from "~/constants";
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
            maxConcurrentProcesses: MAX_CONCURRENT_PROCESSES
        }
    );

    const isRepo = await git.checkIsRepo();

    return isRepo ? git : false;
}
