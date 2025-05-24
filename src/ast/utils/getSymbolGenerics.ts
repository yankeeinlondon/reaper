import { Symbol, Node } from "ts-morph";
import { GenericType } from "~/types";

export function getSymbolGenerics(symbol: Symbol): GenericType[] {
    const declarations = (symbol.getAliasedSymbol() || symbol).getDeclarations()
    const generics: GenericType[] = [];

    declarations.forEach(declaration => {
        if (Node.isFunctionLikeDeclaration(declaration) || Node.isClassDeclaration(declaration) || Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration)) {
            const typeParameters = declaration.getTypeParameters();
            typeParameters.forEach(typeParam => {
                const constraint = typeParam.getConstraint();
                generics.push({
                    name: typeParam.getName(),
                    type: constraint ? constraint.getText() : "unknown"
                });
            });
        }
    });

    return generics;
}
