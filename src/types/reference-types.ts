
/** reference to a function symbol */
export type FunctionRef = `function::${string}`

/** reference to a class symbol */
export type ClassRef = `class::${string}`

/** reference to a function symbol */
export type TypeRef = `type::${string}`

/** reference to a function symbol */
export type TypeUtilityRef = `type::${string}`

export type VariableRef = `variable::${string}`

/** refernce to a re-export of a Symbol */
export type ReExportRef = `re-export::${string}`

export type SymbolRef = 
| FunctionRef
| ClassRef
| TypeRef
| TypeUtilityRef
| VariableRef
| ReExportRef
;
