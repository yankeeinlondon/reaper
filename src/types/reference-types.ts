import { SYMBOL_REF_PREFIXES } from "~/constants"
import { SymbolScope } from "./general";

export type ReferencePrefix = typeof SYMBOL_REF_PREFIXES[number];


/** reference to a function symbol */
export type FunctionRef = `function::${SymbolScope}::${string}`

/** reference to a class symbol */
export type ClassRef = `class::${SymbolScope}::${string}`

/** reference to a function symbol */
export type TypeRef = `type::${SymbolScope}::${string}`

/** reference to a function symbol */
export type TypeUtilityRef = `type-utility::${SymbolScope}::${string}`

export type VariableRef = `variable::${SymbolScope}::${string}`

/** refernce to a re-export of a Symbol */
export type ReExportRef = `re-export::${SymbolScope}::${string}`

/**
 * A fully qualified reference to a symbol
 */
export type SymbolRef = (
| FunctionRef
| ClassRef
| TypeRef
| TypeUtilityRef
| VariableRef
| ReExportRef
);
