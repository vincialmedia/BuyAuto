/**
 * Listing image variant selection.
 *
 * The upload pipeline (storageService.ts → uploadOptimizedImage) generates three
 * variants per upload — _thumbnail (400px), _medium (800px), _large (1200px) —
 * stored on Supabase Storage and served via Cloudflare's CDN. The DB rows hold the
 * _large variant; this helper rewrites the URL to point at a smaller variant when
 * a surface doesn't need 1200px.
 *
 * Variants are typically WebP, but Safari (iOS especially) can fall back to JPEG
 * when canvas WebP encoding is unsupported — see resizeImage in imageOptimization.ts.
 * All three sibling variants for a single upload share the same extension (they're
 * encoded together), so we preserve the source URL's extension on rewrite.
 *
 * Legacy uploads (predating the variant pipeline) have no _<variant> suffix.
 * For those, the URL is returned unchanged.
 */
export type ImageVariant = "thumbnail" | "medium" | "large";

const VARIANT_SUFFIX_RE = /_(thumbnail|medium|large)\.(webp|jpe?g|png)(\?.*)?$/i;

export function getImageVariant(url: string | null | undefined, variant: ImageVariant): string {
  if (!url) return "";
  return url.replace(VARIANT_SUFFIX_RE, (_match, _oldVariant, ext, query = "") => {
    return `_${variant}.${ext}${query}`;
  });
}
