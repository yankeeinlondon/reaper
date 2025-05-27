import type { Symbol } from "ts-morph";
import type { JsDocInfo } from "~/types";
import { Node } from "ts-morph";

/**
 * get's the **JSDoc** information supplied on the current
 * **ts-morph** `Symbol`.
 */
export function getJsDocInfo(symbol: Symbol): JsDocInfo[] {
    const declarations = symbol.getDeclarations();
    const jsDocInfo = declarations.map((declaration) => {
        if (Node.isJSDocable(declaration)) {
            const jsDocs = declaration.getJsDocs();
            const tags = jsDocs.flatMap(jsDoc => jsDoc.getTags().map(tag => ({
                tagName: tag.getTagName(),
                comment: tag.getComment(),
            })));

            const comment = jsDocs.map(jsDoc => jsDoc.getComment()).join("\n");

            return {
                comment,
                tags,
            };
        }
        else {
            return null;
        }
    }).filter(info => info !== null); // Filter out any null entries

    return jsDocInfo;
}
