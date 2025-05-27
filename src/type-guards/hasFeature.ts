import type { Feature, ReaperApi } from "~/types";
import { isArray, isObject, isString } from "inferred-types";

export function hasFeatures<
    F extends readonly Feature[],
>(
    val: unknown,
    ...features: F
): val is ReaperApi<[...F, ...Feature[]]> {
    return isObject(val)
      && "features" in val
      && isArray(val.features)
      && val.features.every(i => isString(i))
      && features.every(f => (val.features as Feature[]).includes(f));
}

export function missingFeatures<
    F extends readonly Feature[],
>(
    val: unknown,
    ...excluding: F
): val is ReaperApi<readonly Exclude<Feature, F[number]>[]> {
    return isObject(val)
      && "features" in val
      && isArray(val.features)
      && val.features.every(i => isString(i))
      && excluding.every(f => !(val.features as Feature[]).includes(f));
}
