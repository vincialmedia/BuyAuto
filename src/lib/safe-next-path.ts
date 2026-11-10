/**
 * True for a path on this site that is safe to send a visitor to after login
 * or checkout: one leading slash, no backslash and no control character.
 *
 * `startsWith("/") && !startsWith("//")` alone is not enough. WHATWG URL
 * parsing treats a backslash like a slash and drops tab, CR and LF, so
 * "/\host" and "/<tab>/host" both resolve to "//host", which is another
 * origin. (pages/auth.tsx applies the same rule to its own redirect param.)
 */
export function isSafeNextPath(input: unknown): input is string {
  return (
    typeof input === "string" &&
    input.startsWith("/") &&
    !input.startsWith("//") &&
    !/[\\\u0000-\u001F]/.test(input)
  );
}

/**
 * Resolves a safe next path against this site's origin. Returns `null` when
 * the path is unsafe or would leave the origin after all.
 */
export function resolveSameOriginUrl(path: unknown, origin: string): URL | null {
  if (!isSafeNextPath(path)) return null;
  try {
    const url = new URL(path, origin);
    return url.origin === new URL(origin).origin ? url : null;
  } catch {
    return null;
  }
}
