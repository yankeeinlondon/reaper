import type { SymbolScope } from "./general";
import type { AstKind } from "./SymbolMeta";
import type { SYMBOL_REF_PREFIXES } from "~/constants";

export type ReferencePrefix = typeof SYMBOL_REF_PREFIXES[number];

/**
 * A fully qualified reference to a symbol
 */
export type SymbolRef<
    K extends AstKind = AstKind,
    S extends SymbolScope = SymbolScope,
    P extends string = string,
> = `${K}::${S}::${P}::${string}`;

/** reference to a function symbol */
export type FunctionRef = SymbolRef<"function">;

/** reference to a class symbol */
export type ClassRef = SymbolRef<"class">;

/** reference to a function symbol */
export type TypeRef = SymbolRef<"type">;

/** reference to a function symbol */
export type TypeUtilityRef = SymbolRef<"type-utility">;

export type VariableRef = SymbolRef<"variable">;

/** refernce to a re-export of a Symbol */
export type ReExportRef = SymbolRef<"re-export">;

/** a locally scoped `Symbol` */
export type LocalRef = SymbolRef<AstKind, "local">;

/** an exported `Symbol` scoped as `module` */
export type ModuleRef = SymbolRef<AstKind, "module">;

/** a externally scoped `Symbol` */
export type ExternalRef = SymbolRef<AstKind, "external">;
