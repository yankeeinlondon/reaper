import { relative } from "pathe";
import { cwd } from "process";
import {
    Node,
    Symbol,
    TypeChecker,
    ts,
    SyntaxKind,
    ModifierableNode,
    SymbolFlags,
    ImportDeclaration,
    VariableDeclaration,
} from "ts-morph";
import {
    isSymbol,
} from "src/type-guards";
import { isSymbolMeta } from "src/type-guards/isSymbolMeta";
import {
    FQN,
    JsDocInfo,
    SymbolFlagKey,
    SymbolKind,
    SymbolMeta,
    SymbolScope,
    GenericType
} from "~/types";
import { Unexpected } from "~/errors";
import { isError } from "@yankeeinlondon/kind-error";
import { ensureTrailing, isString } from "inferred-types";
import chalk from "chalk";
import path from "path";
import { existsSync, readFileSync } from "fs";


export function getSymbolsJSDocInfo(symbol: Symbol): JsDocInfo[] {
    const declarations = symbol.getDeclarations();
    const jsDocInfo = declarations.map(declaration => {
        if (Node.isJSDocable(declaration)) {
            const jsDocs = declaration.getJsDocs();
            const tags = jsDocs.flatMap(jsDoc => jsDoc.getTags().map(tag => ({
                tagName: tag.getTagName(),
                comment: tag.getComment(),
            })));

            const comment = jsDocs.map(jsDoc => jsDoc.getComment()).join("\n");

            return {
                comment,
                tags
            };
        } else {
            return null;
        }
    }).filter(info => info !== null); // Filter out any null entries

    return jsDocInfo;
}

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

/**
 * Tests whether the passed in symbol is external to the repo
 * being evaluated.
 */
export const isExternalSymbol = (sym: Symbol): boolean => {
    const name = getSymbolName(sym);
    return name === sym.getFullyQualifiedName();
}

/**
 * Determines if the given symbol is exported in the project.
 * @param symbol - The ts-morph Symbol to check.
 * @returns True if the symbol is exported; otherwise, false.
 */
export function isSymbolExported(symbol: Symbol): boolean {
    const declarations = symbol.getDeclarations();

    for (const declaration of declarations) {
        try {
            const sourceFile = declaration.getSourceFile();

            // Check if the declaration itself has the 'export' keyword
            if (
                Node.isModifierable(declaration) &&
                declaration.getModifiers().some(mod => mod.getKind() === SyntaxKind.ExportKeyword)
            ) {
                return true;
            }

            // Specifically check for exported const/let/var declarations
            if (Node.isVariableDeclaration(declaration)) {
                const variableStatement = declaration.getParent().getParentIfKind(SyntaxKind.VariableStatement);
                if (
                    variableStatement &&
                    variableStatement.getModifiers().some(mod => mod.getKind() === SyntaxKind.ExportKeyword)
                ) {
                    return true;
                }
            }

            // Check for named exports like 'export { MySymbol };'
            const exportDeclarations = sourceFile.getExportDeclarations();
            for (const exportDecl of exportDeclarations) {
                const namedExports = exportDecl.getNamedExports();
                for (const namedExport of namedExports) {
                    const exportedSymbol = namedExport.getSymbol();

                    if (exportedSymbol && exportedSymbol === symbol) {
                        return true;
                    }
                }
            }

            // Check if the symbol is the default export
            const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
            if (defaultExportSymbol && defaultExportSymbol === symbol) {
                return true;
            }

            // Check if the symbol is exported via a re-export statement like 'export * from "./module";'
            const exportStars = sourceFile.getExportAssignments();
            for (const exportStar of exportStars) {
                const exportedSymbol = exportStar.getSymbol();
                if (exportedSymbol && exportedSymbol === symbol) {
                    return true;
                }
            }

        } catch (err) {
            throw isError(err) 
                ? Unexpected.proxy(err)
                : isString(err)
                    ? Unexpected(err)
                    : Unexpected(String(err));
            
        }
    }


    return false;
}

/**
 * Determines the scope of the given symbol.
 * 
 * Returns:
 *  - `local` if the symbol is defined locally and not exported,
 *  - `module` if the symbol is defined and exported within the scope of
 * the analyzed project,
 *  - `external` if the symbol is from an external library
 */
export function getSymbolScope(symbol: Symbol): SymbolScope {
    const declarations = symbol.getDeclarations();

    // If there are no declarations, it's likely an external symbol
    if (
        declarations.length === 0 ||
        getSymbolKind(symbol) === "external-type"
    ) {
        return 'external';
    }

    // Check if the symbol is declared in an external library
    const firstDeclaration = declarations[0];
    const sourceFile = firstDeclaration.getSourceFile();

    if (sourceFile.isInNodeModules()) {
        return 'external';
    }


    if (isSymbolExported(symbol)) {
        return 'module';
    }

    // If not exported and not from an external library, it's local
    return 'local';
}

/**
 * Checks what external source/npm-package the package comes from.
 * 
 * Returns `null` if the source of the file is local or it's not found in node_modules;
 * otherwise returns the name of the package.
 */
const getSymbolSourcePackage = (symbol: Symbol): string | null => {
    const declarations = symbol.getDeclarations();

    // If there are no declarations, it's likely an external symbol
    if (declarations.length === 0) {
        return null;
    }

    const firstDeclaration = declarations[0];
    const sourceFile = firstDeclaration.getSourceFile();

    // Check if the symbol is declared in an external library (e.g., in node_modules)
    if (sourceFile.isInNodeModules()) {
        let currentNode: Node | undefined = firstDeclaration;

        // Traverse the ancestors to find the ImportDeclaration
        while (currentNode && !Node.isImportDeclaration(currentNode)) {
            currentNode = currentNode.getParent();
        }

        if (currentNode && Node.isImportDeclaration(currentNode)) {
            const importDecl = currentNode as ImportDeclaration;

            const namedImports = importDecl.getNamedImports();
            const defaultImport = importDecl.getDefaultImport();
            const namespaceImport = importDecl.getNamespaceImport();

            // Check if the symbol matches one of the named imports
            if (namedImports.some(namedImport => namedImport.getName() === symbol.getName())) {
                return importDecl.getModuleSpecifierValue();
            }

            // Check if the symbol matches the default import
            if (defaultImport && defaultImport.getText() === symbol.getName()) {
                return importDecl.getModuleSpecifierValue();
            }

            // Check if the symbol matches a namespace import (e.g., import * as X from 'module')
            if (namespaceImport) {
                const namespaceSymbol = namespaceImport.getSymbol();
                if (namespaceSymbol) {
                    const exports = namespaceSymbol.getExports();
                    if (exports.some(exportedSymbol => exportedSymbol.getName() === symbol.getName())) {
                        return importDecl.getModuleSpecifierValue();
                    }
                }
            }
        }
    }

    // If the symbol is not from an external package, return null
    return null;
};

export function getSymbolDefinition(symbol: Symbol): string {
    // Get the declarations associated with the symbol
    const declarations = symbol.getDeclarations();

    // If there are no declarations, return undefined
    if (declarations.length === 0) {
        throw new Error(`Could not get the definition code for the symbol "${symbol.getName()}"`)
    }

    // Get the first declaration (typically, there's only one primary declaration)
    const declaration = declarations[0];

    // Return the full text of the declaration
    return declaration.getFullText();
}

export const createFullyQualifiedNameForSymbol = (sym: Symbol) => {
    const name = getSymbolName(sym);
    const { filepath } = getSymbolFileDefinition(sym);
    const scope = getSymbolScope(sym);

    return (
        scope === "external"
            ? `ext::${String(getSymbolSourcePackage(sym))}::${name}`
            : scope === "local"
                ? `local::${String(filepath)}::${name}`
                : `module::${sym.getFullyQualifiedName()}::${name}`
    ) as FQN
}

/**
 * Produce an output for console display
 */
function display(info: Omit<SymbolMeta, "toJSON" | "toScreen">) {
    const generics = info.generics.length > 0
        ? info.generics.length > 1
            ? "<" + info.generics.map(g => `\n    ${chalk.cyan(g.name)} ${chalk.dim(`${chalk.italic("extends")} ${g.type}`)}`).join(chalk.dim(",")) + "\n>"
            : "<" + info.generics.map(g => `${chalk.cyan(g.name)} ${chalk.dim(`${chalk.italic("extends")} ${g.type}`)}`).join(chalk.dim(", ")) + ">"
        : "";
    const docs = info.jsDocs.flatMap(
                i => i.comment.split("\n")
            ).filter(i => i).length > 0
        ? chalk.dim("/**\n") + info.jsDocs.flatMap(
                i => i.comment.split("\n")
            ).map(
                i => `${chalk.dim(" *")} ${i}` 
            ).join(`\n`) + chalk.dim("\n */")
        : "\n";

    const file = `${chalk.italic("in")} ${info.filepath}`
    const lines = info.startLine && info.endLine
        ? `, ${chalk.italic("lines")} ${chalk.yellow.bold(info.startLine)} ${chalk.italic.dim("to")} ${chalk.yellow.bold(info.endLine)}`
        : ""
    const symColor = info.scope === "local"
        ? chalk.bold
        : info.scope === "external"
        ? chalk.red.bold
        : info.isTypeSymbol
        ? chalk.blue.bold
        : info.isVariable && info.kind !== "const-function"
        ? chalk.green.bold
        : chalk.magenta.bold;
    const importedFrom = `${chalk.yellowBright.bold(info.externalSource?.name)}`

    switch(info.kind) {
        case "class":
            return `${ensureTrailing(docs,"\n")}${chalk.dim("class")} ${symColor(info.name)}${generics} ${file}${lines}\n`
        case "function":
        case "const-function":
            return `${ensureTrailing(docs,"\n")}${symColor(info.name)}${generics}() ${file}${lines}\n`
        case "type-defn":
            return `${ensureTrailing(docs,"\n")}${symColor(info.name)}${generics} ${file}${lines}\n`
        case "external-type":
            return `${ensureTrailing(docs,"\n")}${symColor(info.name)}${generics} ${chalk.italic("imported from")}\n`
        case "property":
            return "";
        default:
            return `${ensureTrailing(docs,"\n")}${symColor(info.name)}${generics}[${info.kind}] ${file}${lines}\n`
    }
}

/**
 * Returns the external package name and version for an external symbol,
 * or null if the symbol is not external or the package cannot be determined.
 */

/**
 * Returns the external package name and version for an external symbol,
 * or undefined if the symbol is not external or the package cannot be determined.
 */
export function getExternalSource(symbol: Symbol): { name: string, version?: string } | undefined {
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) return undefined;

    for (const decl of declarations) {
        const sourceFile = decl.getSourceFile();
        const filePath = sourceFile.getFilePath();

        const nodeModulesIdx = filePath.lastIndexOf("node_modules");
        if (nodeModulesIdx === -1) continue;

        // Handle @types packages
        const relPath = filePath.slice(nodeModulesIdx + "node_modules/".length);
        const parts = relPath.split(path.sep);

        let pkgName: string;
        if (parts[0] === "@types" && parts.length > 1) {
            // e.g. node_modules/@types/lodash
            pkgName = parts[0] + "/" + parts[1];
        } else if (parts[0].startsWith("@") && parts.length > 1) {
            // e.g. node_modules/@scope/pkg
            pkgName = parts[0] + "/" + parts[1];
        } else {
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
        } catch {
            // Ignore errors, just omit version
        }

        return { name: pkgName, version };
    }

    // If no declaration in node_modules found
    return undefined;
}

/**
 * **asSymbolMeta**`(sym) -> SymbolMeta`
 * 
 * Converts a **ts-morph** `Symbol` into a `SymbolMeta` object which
 * contains useful summary information and is serializable.
 * 
 * - Note this step _does not_ add in the dependencies this symbol
 * has on other symbols.
 */
export const asSymbolMeta = (sym: Symbol): SymbolMeta => {
    const flags = getSymbolFlags(sym);
    const isTypeSymbol: boolean = flags.includes("Type")
        || flags.includes("TypeAlias")
        || flags.includes("TypeLiteral")
        || flags.includes("Interface");

    const generics = getSymbolGenerics(sym);
    const scope = getSymbolScope(sym);
    const externalSource = scope === "external"
        ? getExternalSource(sym)
        : undefined;

    const isTypeUtility: boolean = isTypeSymbol && generics.length > 0;

    const isVariable: boolean = flags.includes("Variable")
        || flags.includes("BlockScopedVariable")
        || flags.includes("ConstEnum");

    const isFunction: boolean = flags.includes("Function")
        || flags.includes("FunctionScopedVariable");

    const payload = {
        name: getSymbolName(sym),
        fqn: createFullyQualifiedNameForSymbol(sym),
        // brings in filepath, startLine, and endLine
        ...getSymbolFileDefinition(sym),
        scope,
        externalSource,
        flags,
        isTypeSymbol,
        isTypeUtility,
        isVariable,
        isFunction,
        kind: getSymbolKind(sym),
        generics,
        jsDocs: getSymbolsJSDocInfo(sym),

        refs: [],

        updated: Date.now(),
    } satisfies Omit<SymbolMeta, "toJSON" | "toScreen">;

    return {
        ...payload,
        toScreen(): string {
            return display(payload)
        },
        toJSON() {
            return JSON.stringify(payload, null, 2);
        },
        toString() {
            return JSON.stringify(payload)
        },
    }
}

/**
 * Distinguishes between a true symbol definition and a generic.
 */
export function isGenericSymbol(symbol: Symbol): boolean {
    // Check if the symbol is a type parameter (generic type)
    const flags = symbol.getFlags();
    return (flags & ts.SymbolFlags.TypeParameter) !== 0;
}

/**
 * tests whether the passed in symbol has _any_ of the passed 
 * in `ts.SymbolFlags`
 */
export function symbolHasSymbolFlags(symbol: Symbol, ...find: ts.SymbolFlags[]) {
    const flags = symbol.getFlags();
    return find.some(f => (flags & f) == f)
}

export function isExportedSymbol(symbol: Symbol): boolean {
    const declarations = symbol.getDeclarations();

    if (declarations.length === 0) {
        return false;
    }

    // Check if the symbol is imported
    if (declarations.some(declaration => Node.isImportSpecifier(declaration) || Node.isImportClause(declaration))) {
        return true;
    }

    // Check if the symbol is exported in the current file
    return declarations.some(declaration => {
        const parent = declaration.getParent();

        // For variable declarations, check the parent VariableStatement
        if (Node.isVariableDeclaration(declaration) && parent && Node.isVariableStatement(parent)) {
            return parent.getModifiers().some(modifier =>
                modifier.getKind() === SyntaxKind.ExportKeyword ||
                modifier.getKind() === SyntaxKind.DefaultKeyword
            );
        }

        // For other declarations, check for export keyword directly
        if (
            Node.isFunctionDeclaration(declaration) ||
            Node.isClassDeclaration(declaration) ||
            Node.isInterfaceDeclaration(declaration) ||
            Node.isEnumDeclaration(declaration) ||
            Node.isTypeAliasDeclaration(declaration)
        ) {
            return (declaration as ModifierableNode).getModifiers().some(modifier =>
                modifier.getKind() === SyntaxKind.ExportKeyword ||
                modifier.getKind() === SyntaxKind.DefaultKeyword
            );
        }

        return false;
    });
}

function getReferencedSymbols(node: Node, typeChecker: TypeChecker): Node[] {
    const referencedSymbols: Node[] = [];

    // Recursively find all referenced symbols within the node
    node.forEachDescendant(descendant => {
        if (Node.isIdentifier(descendant)) {
            const symbol = typeChecker.getSymbolAtLocation(descendant);
            if (symbol && !isGenericSymbol(symbol)) {
                referencedSymbols.push(descendant);
            }
        }
    });

    return referencedSymbols;
}

/**
 * finds the symbol **name** for a given symbol or symbol metadata
 * structure.
 */
export const getSymbolName = (sym: Symbol | SymbolMeta): string => {
    const name: string | undefined = isSymbol(sym)
        ? sym.getName()
        : isSymbolMeta(sym)
            ? sym.name
            : undefined;

    if (!name) {
        throw new Error(`Invalid symbol provided to symbolName()!`);
    }

    return name;
}
/**
 * categorizes a **ts-morph** `Symbol` into a broad category defined
 * the `SymbolKind` type alias.
 */
export const getSymbolKind = (symbol: Symbol): SymbolKind => {
    const sym = symbol.getAliasedSymbol() || symbol;
    const declarations = sym.getDeclarations();
    const valueDeclaration = sym.getValueDeclaration();

    // Check if it's an external type
    if (declarations.some(decl => decl.getSourceFile().isFromExternalLibrary())) {
        return "external-type";
    }

    // Check for type definitions or constraints using SymbolFlags
    if (
        symbolHasSymbolFlags(
            sym,
            SymbolFlags.TypeAlias,
            SymbolFlags.Type,
            SymbolFlags.TypeLiteral,
            SymbolFlags.Interface,
            SymbolFlags.TypeParameter,
            SymbolFlags.TypeAliasExcludes
        ) ||
        declarations.some(decl =>
            decl.getKind() === SyntaxKind.TypeAliasDeclaration ||
            decl.getKind() === SyntaxKind.InterfaceDeclaration ||
            decl.getKind() === SyntaxKind.TypeReference
        )
    ) {
        return "type-defn";
    }

    // Check for type constraints using SymbolFlags
    if (
        symbolHasSymbolFlags(
            sym,
            SymbolFlags.TypeParameter,
            SymbolFlags.TypeParameterExcludes,
            SymbolFlags.Type
        ) ||
        declarations.some(decl =>
            decl.getKind() === SyntaxKind.TypeParameter
        )
    ) {
        return "type-constraint";
    }

    // Check for function declarations
    if (
        declarations.some(decl =>
            decl.getKind() === SyntaxKind.FunctionDeclaration
        )
    ) {
        return "function";
    }

    // Check for const-function (variable with function initializer)
    if (
        valueDeclaration &&
        valueDeclaration.getKind() === SyntaxKind.VariableDeclaration
    ) {
        const variableDecl = valueDeclaration as VariableDeclaration;
        const initializer = variableDecl.getInitializer();
        if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
            return "const-function";
        }
    }

    // Check for properties with no declarations
    if (
        symbolHasSymbolFlags(
            sym,
            SymbolFlags.Property,
            SymbolFlags.PropertyExcludes
        )
    ) {

        return "property";
    }

    // If no declarations are available, return "other"
    if (!declarations.length && !valueDeclaration) {
        return "other";
    }

    const symbolType = sym.getTypeAtLocation(
        valueDeclaration || declarations[0]
    );

    // Check if it's an instance of a class
    if (symbolType.isObject() && symbolType.getSymbol()?.getName() !== 'Object') {
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
        return "union-or-intersection"
    }

    // Check if it's a container (object, array, Map, Set, etc.)
    if (
        symbolType.isObject() ||
        symbolType.isArray()
    ) {
        return "container";
    }

    // Default to "other"
    return "other";
}


export const getSymbolFileDefinition = (sym: Symbol): {
    filepath: string;
    startLine: number;
    endLine: number;
} => {
    // Try to get the first declaration of the symbol
    const decl = sym.getDeclarations()[0];

    if (!decl) {
        // If no declarations are found, return undefined values
        return {
            filepath: "",
            startLine: -1,
            endLine: -1
        };
    }

    // Get the source file from the declaration
    const sourceFile = decl.getSourceFile();
    const filepath = relative(cwd(), sourceFile.getFilePath());
    const startLine = decl.getStartLineNumber();
    const endLine = decl.getEndLineNumber();

    return {
        filepath,
        startLine,
        endLine
    };
};

/**
 * type utility which provides the name of the SymbolFlag for a given
 * numerical representation of it's `ts.SymbolFlags` property.
 * 
 * ```ts
 * // 384
 * type Enum = ts.SymbolFlags.Enum;
 * // "Enum"
 * type AndBack = SymbolFlagLookup<Enum>
 * ```
 */
export type SymbolFlagLookup<T extends number> = keyof {
    [K in keyof typeof ts.SymbolFlags as T extends typeof ts.SymbolFlags[K] ? K : never]: K;
};

const reverseLookupEnum = (enumObj: object) => (value: number): SymbolFlagKey[] => {
    return Object.entries(enumObj)
        .filter(([_key, val]) => typeof val === "number" && (value & val) === val)
        .map(([key]) => key as SymbolFlagKey) || `unknown(${value})`;
};

/**
 * **getSymbolFlags**`(sym)`
 * 
 * Every symbol has a "flag" identifier which is provided by 
 * `SymbolFlags` enumeration. The integer value which you
 * would typically get back is a bit hard to work with so 
 * this function instead provides the enumeration _key_ on
 * `ts.SymbolFlags` which is far more contextual.
 * 
 * **Note:** a number can map to more than one key of `SymbolFlags` so
 * in that case the string value with show as a union and the type will
 * be a union too.
 */
export const getSymbolFlags = <T extends Symbol>(sym: T): SymbolFlagKey[] => {
    const flag = sym.getFlags();
    return reverseLookupEnum(SymbolFlags)(flag);
}

/**
 * Returns an array of dependencies for a given symbol.
 * 
 * - the refences are all just fully qualified names
 * - if any of these dependant symbols are _not_ yet in cache
 * they will be added during this discover process
 */
export const getSymbolDependencies = (
    symbol: Symbol,
    typeChecker: TypeChecker
): FQN[] => {
    const dependencies: Map<string, Symbol> = new Map<string, Symbol>;

    // Get the declaration node for the symbol
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) {
        return [];
    }

    // Analyze each declaration of the symbol
    // and add dependencies as we find them
    declarations.forEach(declaration => {
        /** the symbols which a given declaration uses */
        const references = getReferencedSymbols(declaration, typeChecker);

        references.forEach(ref => {
            const refSymbol = typeChecker.getSymbolAtLocation(ref);
            if (refSymbol) {
                let name = refSymbol.getName();
                if (name !== symbol.getName() && !isGenericSymbol(refSymbol)) {
                    if (!dependencies.has(name)) {
                        {
                            dependencies.set(name, refSymbol)
                        }
                    }
                }
            }
        });
    });

    const deps: FQN[] = [];
    for (const [_name, sym] of dependencies) {
        const meta = asSymbolMeta(sym);
        const metaPlus = {
            ...meta,
            dependsOn: getSymbolDependencies(sym),
            usedBy: []
        }
        addSymbolToCache(metaPlus);

        deps.push(meta.fqn);
    }
    return deps;
}

export type GraphNode = {
    symbol: string;
    requiredBy: string;
    depth: number;
}

const removeInitial = (graph: Map<string, GraphNode>): Map<string, GraphNode> => {
    const lvl0: string[] = [];

    for (const sym of graph.values()) {
        if (sym.depth === 0) {
            lvl0.push(sym.symbol);
        }
    }

    for (const sym of lvl0) {
        graph.delete(sym);
    }

    return graph;
}

/**
 * **getDependencyGraph**`(symbols,[excludeInitial=false], [stopDepth=4])
 * 
 * Given a set of dependencies, will recursively iterate through 
 * dependencies and find _new_ dependencies which this collective
 * group of dependencies depends on.
 * 
 * Note: this works off the cache so it assumes this has been loaded.
 */
export const getDependencyGraph = (
    /** the fully qualified names for items in the  */
    symbols: string[],
    excludeInitial: boolean = false,
    stopDepth: number = 4,
    depth: number = 0,
    graph: Map<string, GraphNode> = new Map<string, GraphNode>()
): Map<string, GraphNode> => {

    if (depth === stopDepth) {
        return excludeInitial
            ? removeInitial(graph)
            : graph;
    }

    const newSymbols = symbols
        .filter(s => !graph.has(s)) // no duplicates
        .map(s => lookupSymbol(s))
        .filter(s => s) as SymbolMeta[];
    // now add symbols to graph
    for (const s of newSymbols) {
        graph.set(s.fqn, { symbol: s.fqn, requiredBy: s.name, depth });
    }

    // new deps are only those which now are new
    const newDeps = Array.from(
        new Set(
            newSymbols
                .flatMap(s => s.deps) // all the deps which existed before
        ) // ensure unique
    ).filter(s => !graph.has(s)) // removing newly added symbols


    if (newSymbols.length === 0) {
        return excludeInitial
            ? removeInitial(graph)
            : graph;
    }

    return getDependencyGraph(
        newDeps,
        excludeInitial,
        stopDepth,
        depth + 1,
        graph
    )
}




export function findReferencingSymbols(targetSymbol: Symbol): Symbol[] {
    const referencingSymbols: Symbol[] = [];
    const declarations = targetSymbol.getDeclarations();

    // Get the project from one of the symbol's declarations
    if (declarations.length === 0) return referencingSymbols;
    const project = declarations[0].getSourceFile().getProject();

    declarations.forEach(declaration => {
        const referencedSymbols = project.getLanguageService().findReferences(declaration);

        referencedSymbols.forEach(referencedSymbol => {
            referencedSymbol.getReferences().forEach(ref => {
                const node = ref.getNode();
                const referencingSymbol = node.getSymbol();

                if (referencingSymbol && !referencingSymbols.includes(referencingSymbol)) {
                    referencingSymbols.push(referencingSymbol);
                }
            });
        });
    });

    return referencingSymbols;
}
