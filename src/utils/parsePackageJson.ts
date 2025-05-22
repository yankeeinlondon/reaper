import { existsSync, readFileSync } from "fs";
import { EmptyObject,  stripTrailing } from "inferred-types";
import { join } from "path";
import { PackageJson } from "~/types/package";
// import sj from "superjson";

/**
 * Parses the `package.json` in the passed in folder.
 * 
 * - returns a structured `PackageJson` object if file exists 
 * (and is parsable)
 * - returns `false` if file does not exist or is not parsable
 */
export function parsePackageJson(
    folder: string
): PackageJson | EmptyObject {
    const file = join(stripTrailing(folder, "/package.json"), "package.json");
    if(existsSync(file)) {
        const data = readFileSync(file, "utf-8");
        try {
            const pkg = JSON.parse(data);
            return pkg as PackageJson;
        } catch (err) {
            console.log(err);
            return {} as EmptyObject;
        }
    } else {
        return {} as EmptyObject;
    }
}
