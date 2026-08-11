import styles from "./Padkos.module.css";
import { PadkosTaxi } from "./PadkosTaxi";

interface PadkosLoaderProps {
  /** Drives the .45s cross-fade out before the overlay is unmounted. */
  fading: boolean;
}

/**
 * Full-screen loading overlay: a green road with dashed lane markings and five
 * minibus taxis crossing it at different speeds. Sits above the page rather
 * than replacing it, so the landing content is in the server HTML either way.
 */
export function PadkosLoader({ fading }: PadkosLoaderProps) {
  return (
    <div
      className={`${styles.loader}${fading ? ` ${styles.loaderFading}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <div aria-hidden="true" className={`${styles.lane} ${styles.laneTop}`} />
      <div aria-hidden="true" className={`${styles.lane} ${styles.laneMiddle}`} />
      <div aria-hidden="true" className={`${styles.lane} ${styles.laneBottom}`} />

      <div className={styles.loaderCentre}>
        <div className={styles.loaderPlate}>
          <span className={styles.loaderWordmark}>PADKOS</span>
          <span className={styles.loaderSub}>SOUTH AFRICAN SHOP · WIEN</span>
          <span className={styles.loaderMessage}>
            Almost there – the taxis are on their way!
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={`${styles.taxi} ${styles.taxiLaneTop} ${styles.taxiFromLeft} ${styles.driveA}`}
      >
        <PadkosTaxi />
      </div>
      <div
        aria-hidden="true"
        className={`${styles.taxi} ${styles.taxiLaneTopHigh} ${styles.taxiFromLeft} ${styles.driveD1}`}
      >
        <span className={styles.taxiSmall}>
          <PadkosTaxi />
        </span>
      </div>
      <div
        aria-hidden="true"
        className={`${styles.taxi} ${styles.taxiLaneMiddle} ${styles.taxiFromLeft} ${styles.driveC}`}
      >
        <span className={styles.hootBubble}>HOOT HOOT!</span>
        <PadkosTaxi />
      </div>
      <div
        aria-hidden="true"
        className={`${styles.taxi} ${styles.taxiLaneBottom} ${styles.taxiFromRight} ${styles.driveB}`}
      >
        <span className={styles.taxiFlipped}>
          <PadkosTaxi />
        </span>
      </div>
      <div
        aria-hidden="true"
        className={`${styles.taxi} ${styles.taxiLaneBottom} ${styles.taxiFromLeft} ${styles.driveD2}`}
      >
        <span className={styles.taxiMedium}>
          <PadkosTaxi />
        </span>
      </div>
    </div>
  );
}
