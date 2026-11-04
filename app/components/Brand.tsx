// Grand River University crest and the "Rory" mascot: original artwork, drawn inline
// so it needs no image files and follows the page colors.

export function Crest({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * (140 / 120)} viewBox="0 0 120 140" aria-hidden="true" focusable="false">
      <path d="M60 4 112 22v52c0 32-22 52-52 64C30 126 8 106 8 74V22z" fill="#0b2a5b" />
      <path d="M60 12 104 27v47c0 27-18 44-44 55C34 118 16 101 16 74V27z" fill="#f3f6f4" />
      <path d="M60 22c-18 0-30 14-30 30v12h60V52c0-16-12-30-30-30z" fill="#0b2a5b" />
      <path d="M60 10c-5 8-5 18 0 26 5-8 5-18 0-26z" fill="#c8963e" />
      <path d="M24 82q9-10 18 0t18 0t18 0t18 0" fill="none" stroke="#f2b705" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 98q7-8 14 0t14 0t14 0t14 0" fill="none" stroke="#0b2a5b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Rory the River Guardian: a friendly helmeted figure with a crest, waving hello. */
export function Mascot() {
  return (
    <div className="mascot">
      <div className="mascot-bubble">How can I help you?</div>
      <svg className="mascot-art" viewBox="0 0 200 230" role="img" aria-label="Rory, the Grand River mascot, waving hello">
        {/* plume */}
        <path d="M100 12c-30 0-52 18-56 46h112c-4-28-26-46-56-46z" fill="#c8963e" />
        <path d="M100 4c-10 8-10 22 0 32 10-10 10-24 0-32z" fill="#e4b95c" />
        {/* helmet */}
        <path d="M46 92c0-34 24-58 54-58s54 24 54 58v24H46z" fill="#0b2a5b" />
        <rect x="94" y="34" width="12" height="46" fill="#f2b705" />
        {/* face */}
        <path d="M62 96h76v34c0 22-16 38-38 38s-38-16-38-38z" fill="#f2c9a0" />
        <circle cx="82" cy="116" r="6" fill="#1b2421" />
        <circle cx="118" cy="116" r="6" fill="#1b2421" />
        <circle cx="84" cy="114" r="2" fill="#fff" />
        <circle cx="120" cy="114" r="2" fill="#fff" />
        <path d="M82 138c8 10 28 10 36 0" fill="none" stroke="#1b2421" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="134" r="6" fill="#e9a58a" opacity=".6" />
        <circle cx="130" cy="134" r="6" fill="#e9a58a" opacity=".6" />
        {/* chin strap */}
        <path d="M62 112v22M138 112v22" stroke="#0b2a5b" strokeWidth="5" strokeLinecap="round" />
        {/* body */}
        <path d="M54 180c0-14 20-22 46-22s46 8 46 22v50H54z" fill="#0b2a5b" />
        <path d="M82 162l18 22 18-22" fill="#f3f6f4" />
        <path d="M64 208q9-10 18 0t18 0t18 0t18 0" fill="none" stroke="#f2b705" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        {/* waving arm */}
        <g className="mascot-wave">
          <path d="M146 184c16-4 26-18 28-40" fill="none" stroke="#0b2a5b" strokeWidth="16" strokeLinecap="round" />
          <circle cx="174" cy="138" r="11" fill="#f2c9a0" />
        </g>
      </svg>
    </div>
  );
}
