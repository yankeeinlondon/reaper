export enum SymbolFlagsExt {
  /** Indicates “no kind” – no specific category assigned yet. */
  None = 0,

  /** A `var`-declared variable, visible throughout its function or globally. */
  FunctionScopedVariable = 1,

  /** A `let` or `const` variable, scoped to its enclosing block. */
  BlockScopedVariable = 2,

  /** Any non-method property on a class, interface, or object literal. */
  Property = 4,

  /** A member within an enum declaration. */
  EnumMember = 8,

  /** A standalone function declaration or arrow function expression. */
  Function = 16,

  /** A class declaration, including its constructor and members. */
  Class = 32,

  /** An interface declaration erased at compile time. */
  Interface = 64,

  /** A `const enum`, whose members are inlined at compile time. */
  ConstEnum = 128,

  /** A non-const enum (emits a runtime object). */
  RegularEnum = 256,

  /** An enum declaration (`const` and non-`const` combined). */
  Enum = 384,

  /** A module that exports runtime values (ESM/CommonJS). */
  ValueModule = 512,

  /** A TypeScript “namespace” (purely for grouping types/values). */
  NamespaceModule = 1024,

  /** An inline object type in a type position. */
  TypeLiteral = 2048,

  /** An object literal expression at the value level. */
  ObjectLiteral = 4096,

  /** A method declaration on a class or object literal. */
  Method = 8192,

  /** A constructor declaration within a class. */
  Constructor = 16384,

  /** A getter accessor (`get foo() {}`). */
  GetAccessor = 32768,

  /** A setter accessor (`set foo(v) {}`). */
  SetAccessor = 65536,

  /** A call, construct, or index signature in a type. */
  Signature = 131072,

  /** A type parameter in a generic declaration (`<T>`). */
  TypeParameter = 262144,

  /** A type alias declaration (`type Foo = …`). */
  TypeAlias = 524288,

  /** An import/export alias (`import { X as Y }`). */
  Alias = 2097152,

  /** The implicit `.prototype` property on class constructors. */
  Prototype = 4194304,

  /** A synthetic symbol created internally by the compiler. */
  Transient = 33554432,

  /** A symbol created by assignment patterns (formerly JSContainer). */
  Assignment = 67108864,

  // —––– Compound “Excludes” bitmasks (used by the binder to prevent invalid merges) —–––

  /** Bitmask of flags disallowed when merging a Function symbol. */
  FunctionExcludes = 110991,

  /** Bitmask of flags disallowed for FunctionScopedVariable symbols. */
  FunctionScopedVariableExcludes = 111550,

  /** Bitmask of flags disallowed for BlockScopedVariable symbols. */
  BlockScopedVariableExcludes = 111551,

  /** Bitmask of flags disallowed for Class symbols. */
  ClassExcludes = 899503,

  /** Bitmask of flags disallowed for Interface symbols. */
  InterfaceExcludes = 788872,

  /** Bitmask of flags disallowed for TypeAlias symbols. */
  TypeAliasExcludes = 788968,

  /** Bitmask of flags disallowed for EnumMember symbols. */
  EnumMemberExcludes = 900095,

  /** Bitmask of flags disallowed for Property symbols. */
  PropertyExcludes = 0,

  /** Bitmask of flags disallowed for NamespaceModule symbols. */
  NamespaceModuleExcludes = 0,

  /** Bitmask of flags disallowed for RegularEnum symbols. */
  RegularEnumExcludes = 899327,

  /** Bitmask of flags disallowed for ConstEnum symbols. */
  ConstEnumExcludes = 899967,

  /** Bitmask of flags disallowed for GetAccessor symbols. */
  GetAccessorExcludes = 46015,

  /** Bitmask of flags disallowed for SetAccessor symbols. */
  SetAccessorExcludes = 78783,

  /** Bitmask of flags disallowed for Method symbols. */
  MethodExcludes = 103359,

  /** Bitmask of flags disallowed for PropertyOrAccessor symbols. */
  PropertyOrAccessor = 98308,

  /** Represents parameters and their exclusion bitmask. */
  ParameterExcludes = 111551,

  /** Marks an optional property or parameter (`?`). */
  Optional = 16777216,

  /** A module-export symbol (`export * from …`). */
  ExportStar = 8388608,

  /** A value export symbol (`export const …`). */
  ExportValue = 1048576,

  /** An export-has-local marker. */
  ExportHasLocal = 944,

  /** A module member of a namespace or module. */
  ModuleMember = 2623475,

  /** A flag for modules’ own exports (`module.exports`). */
  ModuleExports = 134217728,

  /** A module declaration (ESM default or TS `module`). */
  Module = 1536,

  /** A catch-all “value-like” or “type-like” union of flags. */
  Value = 111551,

  /** A catch-all “type-like” union of flags. */
  Type = 788968,

  /** A catch-all “namespace-like” union of flags. */
  Namespace = 1920,

  /** A catch-all block-scoped category (let/const). */
  BlockScoped = 418,

  /** A catch-all alias duplicates value & type categories. */
  AliasExcludes = 2097152
}
