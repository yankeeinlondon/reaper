import type { Symbol, TypeChecker } from "ts-morph";
import type { ClassMethod, GenericType } from "~/types";
import type { FunctionParameter, FunctionReturn } from "~/types/function-types";
import type { JsDocInfo } from "~/types/symbol-ast-types";
import { Node } from "ts-morph";
import { getFunctionParameters } from "../functions/getFunctionParameters";
import { getFunctionReturn } from "../functions/getFunctionReturn";

export function getConstructor(
    sym: Symbol,
    options?: { checker?: TypeChecker },
): ClassMethod | undefined {
    const decl = sym.getDeclarations()[0];
    if (!decl || !Node.isClassDeclaration(decl))
        return undefined;
    const checker = options?.checker || decl.getSourceFile().getProject().getTypeChecker();
    const ctor = decl.getConstructors()[0];
    if (!ctor)
        return undefined;
    const scope = "public"; // Constructors are always public in TS
    const isAbstract = false;
    const isAsync = false;
    const isGenerator = false;
    // Constructors do not support decorators in TypeScript
    const decorators: any[] = [];
    const generics: GenericType[] = ctor.getTypeParameters().map(tp => ({
        name: tp.getName(),
        type: tp.getConstraint() ? tp.getConstraint()!.getText() : "unknown",
    }));
    const parameters: FunctionParameter[] = getFunctionParameters(ctor.getSymbol()!, { checker });
    const returnType: FunctionReturn = getFunctionReturn(ctor.getSymbol()!, { checker });
    const jsDocs: JsDocInfo[] = ctor.getJsDocs().map((jsDoc) => {
        let comment: string = "";
        const raw = jsDoc.getComment();
        if (typeof raw === "string") {
            comment = raw;
        }
        else if (Array.isArray(raw)) {
            comment = raw.map(r => (typeof r === "string" ? r : (r && "text" in r ? r.text : ""))).join("");
        }
        return {
            comment,
            tags: jsDoc.getTags().map(tag => ({
                tagName: tag.getTagName(),
                comment: tag.getComment(),
            })),
        };
    });
    return {
        name: "constructor",
        scope,
        isAbstract,
        isAsync,
        isGenerator,
        decorators,
        generics,
        parameters,
        returnType,
        jsDocs,
        toJSON() { return JSON.stringify(this); },
        toString() { return `${scope} constructor()`; },
        toConsole() { return `${scope} constructor()`; },
    };
}
