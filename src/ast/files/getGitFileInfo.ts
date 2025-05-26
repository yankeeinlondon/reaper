import { SourceFile } from "ts-morph";
import { isSourceFile } from "~/type-guards";
import { getFilePath } from "./getFilePath";
import { simpleGit } from "simple-git";
import { MAX_CONCURRENT_PROCESSES, getRoot } from "~/constants";
import { FileRef } from "~/types";
import { asFileRef } from "./file-cache";
import { md5 } from "~/utils";

export type GitFileInfo = {
    file: FileRef;
    isGitRepo: boolean;
    /** the last commit in which this file was updated */
    lastCommit: string | undefined;

    /** 
     * has the file been modified from the last commited version of 
     * the file?
     */
    isDirty: boolean;

    /** a hash value for the contents of the file */
    hash: string;
}

export async function getGitFileInfo(file: SourceFile | string) {
    const resolvedFilepath = isSourceFile(file)
        ? getFilePath(file)
        : file;
    const git = simpleGit(
        getRoot(),
        {
            maxConcurrentProcesses: MAX_CONCURRENT_PROCESSES
        }
    );

    const isRepo = await git.checkIsRepo();
    
    if(isRepo) {
        // Get last commit hash for this file
        let lastCommit: string | undefined = undefined;
        try {
            const log = await git.log({ file: resolvedFilepath, n: 1 });
            lastCommit = log.latest?.hash;
        } catch {}

        // Check if file is dirty (modified or staged)
        let isDirty = false;
        try {
            const status = await git.status([resolvedFilepath]);
            isDirty = status.modified.includes(resolvedFilepath) || status.staged.includes(resolvedFilepath);
        } catch {}

        // Hash the file contents
        let hash = "";
        try {
            hash = md5(resolvedFilepath);
        } catch {}

        return {
            file: asFileRef(resolvedFilepath),
            isGitRepo: true,
            lastCommit,
            isDirty,
            hash
        } satisfies GitFileInfo;
    }
    
    // Not a git repo, return minimal info
    return {
        file: asFileRef(resolvedFilepath),
        isGitRepo: false,
        lastCommit: undefined,
        isDirty: false,
        hash: ""
    } satisfies GitFileInfo;
}
