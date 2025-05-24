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
import {
    FQN,
    JsDocInfo,
    SymbolFlagKey,
    SymbolKind,
    SymbolsMeta,
    SymbolScope,
    GenericType
} from "~/types";
import { Unexpected } from "~/errors";
import { isError } from "@yankeeinlondon/kind-error";
import { ensureTrailing, isString } from "inferred-types";
import chalk from "chalk";
import path from "path";
import { existsSync, readFileSync } from "fs";
import { isSymbolMeta } from "~/type-guards/isSymbolsMeta";
import { getSymbolKind } from "./utils/getSymbolKind";






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



/**
 * Produce an output for console display
 */
function display(info: Omit<SymbolsMeta, "toJSON" | "toScreen">) {
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
 * **assymbolsMeta**`(sym) -> symbolsMeta`
 * 
 * Converts a **ts-morph** `Symbol` into a `symbolsMeta` object which
 * contains useful summary information and is serializable.
 * 
 * - Note this step _does not_ add in the dependencies this symbol
 * has on other symbols.
 */
export const asSymbolsMeta = (sym: Symbol): SymbolsMeta => {
    const flags = getSymbolFlags(sym);
    const isTypeSymbol: boolean = flags.includes("Type")
        || flags.includes("TypeAlias")
        || flags.includes("TypeLiteral")
        || flags.includes("Interface");

    

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
    } satisfies Omit<SymbolsMeta, "toJSON" | "toScreen">;

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
        const meta = asSymbolsMeta(sym);
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
        .filter(s => s) as SymbolsMeta[];
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
