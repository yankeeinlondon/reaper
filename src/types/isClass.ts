import { Symbol, TypeChecker } from "ts-morph";


export function isClassDefinition(
    sym: Symbol, 
    options?: { checker?: TypeChecker }
): boolean {
    for (const d of sym.getDeclarations()) {
        if (d.getKindName() === "ClassDeclaration") {
            return true;
        }
    }
    // Optionally use checker to check type
    const checker = options?.checker;
    if (checker) {
        const decl = sym.getDeclarations()[0];
        if (decl) {
            const type = checker.getTypeOfSymbolAtLocation(sym, decl);
            if (type.isClass && type.isClass()) {
                return true;
            }
        }
    }
    return false;
}


export function isClassInstance(
    sym: Symbol, 
    options?: { checker?: TypeChecker }
): boolean {
    const checker = options?.checker;
    const decl = sym.getDeclarations()[0];
    if (checker && decl) {
        const type = checker.getTypeOfSymbolAtLocation(sym, decl);
        // A class instance is an object whose symbol is a class
        if (type.isObject && type.isObject()) {
            const classSym = type.getSymbol();
            if (classSym && classSym.getDeclarations().some(d => d.getKindName() === "ClassDeclaration")) {
                return true;
            }
        }
    }
    return false;
}

