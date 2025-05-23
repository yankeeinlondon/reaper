import type {
    AnyFunction, Dictionary,
    FnProps,
    LiteralFn,
    MergeObjects,
    Narrowable,
    ObjectKey,
    TypedFunction,
} from "inferred-types";


type FnWithProps<
    TFn extends TypedFunction,
    TProps extends Record<ObjectKey, Narrowable>,
    TNarrowing extends boolean,
    Fn extends <A extends Parameters<TFn>>(...args: A) => ReturnType<TFn> = <A extends Parameters<TFn>>(...args: A) => ReturnType<TFn>
> = TNarrowing extends true
    ? Fn & MergeObjects<FnProps<TFn>, TProps>
    : LiteralFn<Fn> & MergeObjects<FnProps<TFn>, TProps>;

/**
 * **fnProps**`(fn)`
 *
 * Extracts any key/value pairs found along with the function.
 */
export function fnProps<T extends AnyFunction>(fn: T) {
    const names = Object.getOwnPropertyNames(fn);
    const props: Dictionary = {};

    for (const key of names) {
        if (!["name", "length"].includes(key)) {
            props[key] = fn[key as keyof typeof fn];
        }
        else if (key === "name" && fn[key as keyof typeof fn] !== "") {
            props[key] = fn[key as keyof typeof fn];
        }
    }

    return props as FnProps<T>;
}


/**
 * **createFnWithProps**`(fn, props)`
 *
 * Creates a strongly typed function along with properties.
 *
 * **Note:** since the runtime is trying it's hardest to extract
 * narrow types, it will sometimes reject types it ideally wouldn't.
 * In these cases you may want to consider using `createFnWithPropsExplicit`
 * instead.
 */
export function createFnWithProps<
    TArgs extends readonly any[],
    TRtn extends Narrowable,
    TProps extends Record<ObjectKey, N>,
    N extends Narrowable,
    // R extends Narrowable,
    TFn extends (...args: TArgs) => TRtn,
    TNarrowing extends boolean = false,
>(
    fn: TFn,
    props: TProps,
    _narrowing: TNarrowing = false as TNarrowing
) {
    let fnWithProps: any = fn;
    const p = {
        ...(fnProps(fn)),
        ...props
    };
    for (const prop of Object.keys(p)) {
        if (prop !== "name") {
            fnWithProps[prop] = p[prop];
        }
    }

    if ("name" in props) {
        fnWithProps = Object.defineProperties(fnWithProps, {
            name: {
                value: p.name,
                writable: false
            }
        });
    }

    return fnWithProps as unknown as FnWithProps<
        TFn,
        TProps,
        TNarrowing
    >;
}
