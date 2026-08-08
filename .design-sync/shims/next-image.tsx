// next/image shim for the design-system export.
//
// The real next/image needs the Next image-optimization endpoint, which does
// not exist in a design render — images would 404 and every card that shows a
// vehicle photo would come up empty. This renders a plain <img> and reproduces
// the two layout behaviours components actually depend on: `fill` (absolutely
// positioned, covering the positioned ancestor) and intrinsic width/height.
import * as React from 'react';

export type ImageProps = {
  src: string | { src: string; width?: number; height?: number };
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  // Next-only hints — consumed, never forwarded to the DOM.
  priority?: boolean;
  quality?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
  sizes?: string;
  onLoadingComplete?: unknown;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height' | 'loading' | 'placeholder'>;

// Components reference photos from public/ with a root-absolute path
// ("/buyauto-logo-header.png"). A preview card is opened over file://, where
// a leading "/" resolves to the filesystem root, so every one of those images
// 404s and the card loses its logo or hero photo.
//
// copy-public-assets.mjs mirrors the referenced files into the bundle's
// _preview/assets/, and this resolves "/x.png" against the bundle root. The
// root is derived from the stylesheet link the card already carries
// (href="../../../styles.css"), which makes it correct at any card depth
// without the shim needing to know where it is.
//
// If no such link is present — i.e. this is not a preview card but a real
// design rendering the bundle, where the project root is served over HTTP and
// "/x.png" already resolves — the src is returned untouched.
function resolveAssetSrc(src: string | undefined): string | undefined {
  if (!src || !src.startsWith('/') || typeof document === 'undefined') return src;

  const link = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).find(
    (l) => l.getAttribute('href')?.endsWith('styles.css'),
  );
  const href = link?.getAttribute('href');
  if (!href) return src;

  const root = href.slice(0, -'styles.css'.length); // e.g. "../../../"
  return `${root}_preview/assets${src}`;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    src,
    alt,
    width,
    height,
    fill,
    priority,
    quality,
    loading,
    placeholder,
    blurDataURL,
    unoptimized,
    loader,
    sizes,
    onLoadingComplete,
    style,
    ...rest
  },
  ref,
) {
  const resolved = resolveAssetSrc(typeof src === 'string' ? src : src?.src);

  // `fill` in next/image means "absolutely fill the nearest positioned
  // ancestor". object-fit is left to the caller's className, exactly as Next
  // does — components in this repo set object-cover themselves.
  const fillStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
    : {};

  return (
    <img
      ref={ref}
      src={resolved}
      alt={alt}
      width={fill ? undefined : (width as number | undefined)}
      height={fill ? undefined : (height as number | undefined)}
      // eager: preview cards are screenshotted immediately, and a lazy image
      // below the fold would be captured before it ever starts loading.
      loading="eager"
      sizes={sizes}
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
});

export default Image;
