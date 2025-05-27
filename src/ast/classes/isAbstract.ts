import type { Symbol } from "ts-morph";
import { Node, SyntaxKind } from "ts-morph";

/**
 * Returns true if the symbol is a class or method and is marked as abstract.
 */
export function isAbstract(sym: Symbol): boolean {
    for (const d of sym.getDeclarations()) {
        if (
            (Node.isClassDeclaration(d) || Node.isMethodDeclaration(d))
      && d.getModifiers().some(mod => mod.getKind() === SyntaxKind.AbstractKeyword)
        ) {
            return true;
        }
    }
    return false;
}

/**
 * tests whether the **class** symbol passed in is abstract or not.
 */
export function isAbstractClass(sym: Symbol) {
    for (const d of sym.getDeclarations()) {
        if (Node.isClassDeclaration(d)) {
            return d.getModifiers().some(mod => mod.getKind() === SyntaxKind.AbstractKeyword);
        }
    }
    return false;
}

/**
 * tests whether a class method is _abstract_ or not.
 */
export function isAbstractMethod(sym: Symbol) {
    for (const d of sym.getDeclarations()) {
        if (Node.isMethodDeclaration(d)) {
            return d.getModifiers().some(mod => mod.getKind() === SyntaxKind.AbstractKeyword);
        }
    }
    return false;
}
