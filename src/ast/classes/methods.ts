import type { Symbol, TypeChecker } from "ts-morph";
import type { ClassMethod, GenericType } from "~/types";
import type { FunctionParameter, FunctionReturn } from "~/types/function-types";
import type { JsDocInfo } from "~/types/symbol-ast-types";
import { Node } from "ts-morph";
import { getFunctionParameters } from "../functions/getFunctionParameters";
import { getFunctionReturn } from "../functions/getFunctionReturn";

export function getClassMethods(
    sym: Symbol,
    options?: { checker?: TypeChecker },
): ClassMethod[] {
    const decl = sym.getDeclarations()[0];
    if (!decl || !Node.isClassDeclaration(decl))
        return [];
    const checker = options?.checker || decl.getSourceFile().getProject().getTypeChecker();
    const methods: ClassMethod[] = [];
    for (const member of decl.getMembers()) {
        if (Node.isMethodDeclaration(member) && !member.isStatic()) {
            const scope = member.getScope() || "public";
            const isAbstract = member.isAbstract?.() || false;
            const isAsync = member.isAsync?.() || false;
            const isGenerator = member.isGenerator?.() || false;
            const decorators = member.getDecorators().map(d => ({
                name: d.getName(),
                arguments: d.getArguments().map(a => a.getText()),
                text: d.getText(),
            }));
            const generics: GenericType[] = member.getTypeParameters().map(tp => ({
                name: tp.getName(),
                type: tp.getConstraint() ? tp.getConstraint()!.getText() : "unknown",
            }));
            const parameters: FunctionParameter[] = getFunctionParameters(member.getSymbol()!, { checker });
            const returnType: FunctionReturn = getFunctionReturn(member.getSymbol()!, { checker });
            const jsDocs: JsDocInfo[] = member.getJsDocs().map((jsDoc) => {
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
            methods.push({
                name: member.getName(),
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
                toString() { return `${scope} method ${member.getName()}()`; },
                toConsole() { return `${scope} method ${member.getName()}()`; },
            });
        }
    }
    return methods;
}
