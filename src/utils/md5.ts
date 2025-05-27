import type { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

/**
 * Uses MD5 algorithm for a _fast_ but not necessarily
 * cryptographically secure way to hash data into a
 * hex based string value.
 */
export function md5(
    data: string | Buffer,
): string {
    return createHash("md5").update(data).digest("hex");
}
