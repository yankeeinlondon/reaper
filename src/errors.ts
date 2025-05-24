import { createKindError } from "@yankeeinlondon/kind-error";

export const MissingConfig = createKindError(
    "MissingConfig"
)

export const InvalidConfig = createKindError(
    "InvalidConfig"
)

export const Unexpected = createKindError(
    "Unexpected"
)

export const DiagnosticError = createKindError(
    "Diagnostic",
    { library: "@yankeeinlondon/reaper" }
)

export const NotFunction = createKindError(
    "NotFunction",
    { library: "@yankeeinlondon/reaper" }
)

export const MissingFeature = createKindError(
    "MissingFeature",
    { library: "@yankeeinlondon/reaper" }
)

export const InvalidSymbol = createKindError(
    "InvalidSymbol",
    { library: "@yankeeinlondon/reaper" }
)
