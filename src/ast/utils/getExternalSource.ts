import type { Symbol } from "ts-morph";
import type { PackageJson } from "~/types";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Returns the external package name and version for an external symbol,
 * or undefined if the symbol is not external or the package cannot be determined.
 */
export function getExternalSource(
    symbol: Symbol,
): PackageJson | undefined {
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0)
        return undefined;

    for (const decl of declarations) {
        const sourceFile = decl.getSourceFile();
        const filePath = sourceFile.getFilePath();

        const nodeModulesIdx = filePath.lastIndexOf("node_modules");
        if (nodeModulesIdx === -1)
            continue;

        // Handle @types packages
        const relPath = filePath.slice(nodeModulesIdx + "node_modules/".length);
        const parts = relPath.split(path.sep);

        let pkgName: string;
        if (parts[0] === "@types" && parts.length > 1) {
            // e.g. node_modules/@types/lodash
            pkgName = `${parts[0]}/${parts[1]}`;
        }
        else if (parts[0].startsWith("@") && parts.length > 1) {
            // e.g. node_modules/@scope/pkg
            pkgName = `${parts[0]}/${parts[1]}`;
        }
        else {
            pkgName = parts[0];
        }

        // Try to read the version from the package's package.json
        let version: string | undefined;
        try {
            const pkgRoot = path.join(filePath.slice(0, nodeModulesIdx + "node_modules/".length), pkgName);
            const pkgJsonPath = path.join(pkgRoot, "package.json");
            if (existsSync(pkgJsonPath)) {
                const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
                version = pkgJson.version;
            }
        }
        catch {
            // Ignore errors, just omit version
        }

        return { name: pkgName, version };
    }

    // If no declaration in node_modules found
    return undefined;
}
