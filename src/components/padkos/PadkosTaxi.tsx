/**
 * The Cape Town minibus taxi that drives across the Padkos loading screen.
 *
 * Purely decorative — every instance sits inside an aria-hidden container, so
 * the SVG carries no title or role of its own.
 */
export function PadkosTaxi() {
  return (
    <svg width="92" height="50" viewBox="0 0 92 50" aria-hidden="true" focusable="false">
      {/* Body: flat front, sloped windscreen down to the bonnet. */}
      <path
        d="M5 40 L5 20 Q5 12 13 12 L56 12 Q68 12 76 17 L83 24 Q87 28 87 33 L87 40 Z"
        fill="#F7EEDB"
        stroke="#382A1C"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Gold-over-green side stripe. */}
      <rect x="7" y="29" width="78" height="4" fill="#FFB612" />
      <rect x="7" y="33" width="78" height="3" fill="#007A4D" />
      {/* Passenger windows, then the raked windscreen. */}
      <rect x="10" y="16" width="13" height="9" rx="1.5" fill="#BFD9D2" stroke="#382A1C" strokeWidth="1.5" />
      <rect x="27" y="16" width="13" height="9" rx="1.5" fill="#BFD9D2" stroke="#382A1C" strokeWidth="1.5" />
      <rect x="44" y="16" width="12" height="9" rx="1.5" fill="#BFD9D2" stroke="#382A1C" strokeWidth="1.5" />
      <path
        d="M60 16 L68 16 Q74 18 79 24 L60 25 Z"
        fill="#BFD9D2"
        stroke="#382A1C"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="83" y="26" width="4" height="4" rx="1" fill="#FFB612" />
      <circle cx="23" cy="41" r="7" fill="#2A2119" stroke="#382A1C" strokeWidth="2" />
      <circle cx="23" cy="41" r="2.5" fill="#F7EEDB" />
      <circle cx="70" cy="41" r="7" fill="#2A2119" stroke="#382A1C" strokeWidth="2" />
      <circle cx="70" cy="41" r="2.5" fill="#F7EEDB" />
    </svg>
  );
}
