import type { CSSProperties, ReactNode } from "react";

import styles from "./PadkosShop.module.css";

interface PadkosPhotoProps {
  /** Describes the photograph that will replace the placeholder. */
  alt: string;
  caption: string;
  from: string;
  to: string;
  /** e.g. "4 / 5" for product cards, "4 / 3" for the bundle hero. */
  aspectRatio?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Photography is not shot yet. Every image slot renders as a kraft-paper
 * rectangle in the product's own tint, labelled with the shot it awaits and
 * carrying the alt text the final photo will need.
 */
export function PadkosPhoto({
  alt,
  caption,
  from,
  to,
  aspectRatio = "4 / 5",
  className,
  children,
}: PadkosPhotoProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`${styles.photo}${className ? ` ${className}` : ""}`}
      style={{ "--photo-from": from, "--photo-to": to, aspectRatio } as CSSProperties}
    >
      <span className={styles.photoLabel}>{caption}</span>
      {children}
    </div>
  );
}
