import { TypedFunction } from "inferred-types";

export function wrapFn<
    T extends TypedFunction,
    U extends (fn: T, args: Parameters<T>) => unknown
>(
    fn: T,
    wrapper: U
) {
    return <TParams extends Parameters<T>>(...args: TParams) => {
        return wrapper(fn, args);   
    }
}
