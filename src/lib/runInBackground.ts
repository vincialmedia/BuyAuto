type RequestContext = { waitUntil?: (promise: Promise<unknown>) => void };
type ContextStore = { get?: () => RequestContext | undefined };

/**
 * Keeps work alive after the response has been sent (server-only).
 *
 * On Vercel the platform exposes a per-request context with `waitUntil` on
 * globalThis. This is the same lookup that @vercel/functions' waitUntil and
 * Next's own after() use, inlined because that package pulls in far more than
 * these few lines. Without such a context (next start, local dev) the promise
 * simply runs to completion in the long-lived process.
 */
export function runInBackground(task: Promise<unknown>): void {
  const guarded = task.catch((error) => {
    console.error("Background task failed:", error);
  });
  const scope = globalThis as unknown as Record<symbol, ContextStore | undefined>;
  const context =
    scope[Symbol.for("@vercel/request-context")]?.get?.() ?? scope[Symbol.for("@next/request-context")]?.get?.();
  context?.waitUntil?.(guarded);
}
