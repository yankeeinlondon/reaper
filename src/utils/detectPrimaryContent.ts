import { getRoot } from "~/constants";
import { isMonorepo } from "@yankeeinlondon/is-monorepo";
import { repoRoot } from "repo-root";

export type ContentType = 
| "javascript"
| "typescript"
| "python"
| "rust"
| "golang"
| "php"
| "cpp"
| "c#"
| "shell"
| "documentation" // .md or .txt or .doc
| "unknown";


export type PrimaryContent__MONOREPO = {
    kind: "PrimaryContent";
    isMonorepo: true;
    packages: Record<string, ContentType>;
}

export type PrimaryContent__NON_MONOREPO = {
    kind: "PrimaryContent";
    isMonorepo: false;
    primaryContent: ContentType;
}

function detect(filepath: string) {
    const distro = ""

}

/**
 * Using a repo's distribution of file extensions and any other file's which provide
 * a strong indicator of "content type" we will try to deduce:
 * 
 * - what is the predominant content-type for the given repo
 * - in most cases we'd expect this to be a programming language but
 * potentially it's just a documentation site too
 */
export function detectPrimaryContent(filepath?: string) {
    const root = filepath ? repoRoot(filepath) : getRoot();
    const mono = isMonorepo(root);


}
