import type {
    Symbol,
    VariableDeclaration,
} from "ts-morph";
import type { SymbolKind } from "~/types";
import {
    SymbolFlags,
    SyntaxKind,
} from "ts-morph";
import { hasSomeSymbolFlags } from "~/type-guards";

/**
 * categorizes a **ts-morph** `Symbol` into a broad category defined
 * by the `SymbolKind` type alias.
 *
 * @deprecated this will likely be removed in favor of using only
 * `AstKind` and the `getAstKind()` utility.
 */
export function getSymbolKind(symbol: Symbol): SymbolKind {
    const sym = symbol.getAliasedSymbol() || symbol;
    const declarations = sym.getDeclarations();
    const valueDeclaration = sym.getValueDeclaration();

    // Check if it's an external type
    if (declarations.some(decl => decl.getSourceFile().isFromExternalLibrary())) {
        return "external-type";
    }

    // Check for type definitions or constraints using SymbolFlags
    if (
        hasSomeSymbolFlags(
            sym,
            SymbolFlags.TypeAlias,
            SymbolFlags.Type,
            SymbolFlags.TypeLiteral,
            SymbolFlags.Interface,
            SymbolFlags.TypeParameter,
            SymbolFlags.TypeAliasExcludes,
        )
    || declarations.some(decl =>
        decl.getKind() === SyntaxKind.TypeAliasDeclaration
      || decl.getKind() === SyntaxKind.InterfaceDeclaration
      || decl.getKind() === SyntaxKind.TypeReference,
    )
    ) {
        return "type-defn";
    }

    // Check for type constraints using SymbolFlags
    if (
        hasSomeSymbolFlags(
            sym,
            SymbolFlags.TypeParameter,
            SymbolFlags.TypeParameterExcludes,
            SymbolFlags.Type,
        )
    || declarations.some(decl =>
        decl.getKind() === SyntaxKind.TypeParameter,
    )
    ) {
        return "type-constraint";
    }

    // Check for function declarations
    if (
        declarations.some(decl =>
            decl.getKind() === SyntaxKind.FunctionDeclaration,
        )
    ) {
        return "function";
    }

    // Check for const-function (variable with function initializer)
    if (
        valueDeclaration
    && valueDeclaration.getKind() === SyntaxKind.VariableDeclaration
    ) {
        const variableDecl = valueDeclaration as VariableDeclaration;
        const initializer = variableDecl.getInitializer();
        if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
            return "const-function";
        }
    }

    // Check for properties with no declarations
    if (
        hasSomeSymbolFlags(
            sym,
            SymbolFlags.Property,
            SymbolFlags.PropertyExcludes,
        )
    ) {
        return "property";
    }

    // If no declarations are available, return "other"
    if (!declarations.length && !valueDeclaration) {
        return "other";
    }

    const symbolType = sym.getTypeAtLocation(
        valueDeclaration || declarations[0],
    );

    // Check if it's an instance of a class
    if (symbolType.isObject() && symbolType.getSymbol()?.getName() !== "Object") {
        const isInstance = symbolType.getSymbol()?.getDeclarations().some(decl => decl.getKind() === SyntaxKind.ClassDeclaration);
        if (isInstance) {
            return "instance";
        }
    }

    // Check if it's a class
    if (symbolType.isClass()) {
        return "class";
    }

    // Check if it's a scalar type (number, string, boolean, etc.)
    if (symbolType.isString() || symbolType.isNumber() || symbolType.isBoolean() || symbolType.isEnum() || symbolType.isLiteral()) {
        return "scalar";
    }

    if (symbolType.isUnionOrIntersection()) {
        return "union-or-intersection";
    }

    // Check if it's a container (object, array, Map, Set, etc.)
    if (
        symbolType.isObject()
    || symbolType.isArray()
    ) {
        return "container";
    }

    // Default to "other"
    return "other";
}
