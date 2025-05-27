import type { DisplayOpts, GenericType, SymbolMeta } from "~/types";
import chalk from "chalk";

function genericType(
    g: GenericType,
    opts: DisplayOpts,
) {
    const format = opts.format || "text";
    const isUnknown = g.type === "unknown";

    return isUnknown
        ? ""
        : format === "text"
            ? `extends ${g.type}`
            : `${chalk.italic.dim("extends")} ${chalk.bold(g.type)}`;
}

/**
 * displays generic parameters on a _per device_ manner.
 */
export function displayGenerics(
    sym: SymbolMeta,
    opts: DisplayOpts,
): string {
    if (sym.generics.length === 0) {
        return "";
    }
    const name = (str: string) => opts.format === "console"
        ? chalk.yellowBright(str)
        : str;

    return `<${sym.generics.map(i => `${name(i.name)}${genericType(i, opts)}`)}>`;
}
