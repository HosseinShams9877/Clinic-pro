import type { CSSProperties, JSX } from "react";

/**
 * Icon.tsx — the site's icon system.
 *
 * The reference ships its icons as an inline `<symbol>` sprite
 * (پلتفرم/services.html lines 17–58, plus i-band in index.html line 70).
 * Those symbols are transcribed VERBATIM below — no path data was redrawn,
 * simplified, or "improved" — so the new site inherits the reference's visual
 * identity exactly (A7: assets copied out of the reference, not reinvented).
 *
 * Rendering happens per-icon as an inline SVG instead of `<use href="#…">`:
 * the reference's `<use>` sprite depends on a hidden `<svg>` being present in
 * every document, which fights Next.js's per-route component tree. Inline
 * paths are framework-native, still get `currentColor` from the cascade, and
 * keep the exact same vector data.
 */

/** Every icon name the reference sprite defines. */
export type IconName =
  | "i-eye"
  | "i-ear"
  | "i-women"
  | "i-kidney"
  | "i-bone"
  | "i-scalpel"
  | "i-heart"
  | "i-laser"
  | "i-hair"
  | "i-calendar"
  | "i-phone"
  | "i-search"
  | "i-doctor"
  | "i-clipboard"
  | "i-shield"
  | "i-clock"
  | "i-upload"
  | "i-globe"
  | "i-building"
  | "i-bed"
  | "i-team"
  | "i-arrow"
  | "i-check"
  | "i-pin"
  | "i-mail"
  | "i-insta"
  | "i-chev"
  | "i-plus"
  | "i-air"
  | "i-steril"
  | "i-layers"
  | "i-menu"
  | "i-logo"
  | "i-steth"
  | "i-user"
  | "i-x"
  | "i-play"
  | "i-chat"
  | "i-ext"
  | "i-band";

/** viewBox of each symbol, from the reference sprite. i-logo is 48×48, rest 24×24. */
const VIEW_BOX: Readonly<Record<IconName, string>> = {
  "i-eye": "0 0 24 24",
  "i-ear": "0 0 24 24",
  "i-women": "0 0 24 24",
  "i-kidney": "0 0 24 24",
  "i-bone": "0 0 24 24",
  "i-scalpel": "0 0 24 24",
  "i-heart": "0 0 24 24",
  "i-laser": "0 0 24 24",
  "i-hair": "0 0 24 24",
  "i-calendar": "0 0 24 24",
  "i-phone": "0 0 24 24",
  "i-search": "0 0 24 24",
  "i-doctor": "0 0 24 24",
  "i-clipboard": "0 0 24 24",
  "i-shield": "0 0 24 24",
  "i-clock": "0 0 24 24",
  "i-upload": "0 0 24 24",
  "i-globe": "0 0 24 24",
  "i-building": "0 0 24 24",
  "i-bed": "0 0 24 24",
  "i-team": "0 0 24 24",
  "i-arrow": "0 0 24 24",
  "i-check": "0 0 24 24",
  "i-pin": "0 0 24 24",
  "i-mail": "0 0 24 24",
  "i-insta": "0 0 24 24",
  "i-chev": "0 0 24 24",
  "i-plus": "0 0 24 24",
  "i-air": "0 0 24 24",
  "i-steril": "0 0 24 24",
  "i-layers": "0 0 24 24",
  "i-menu": "0 0 24 24",
  "i-logo": "0 0 48 48",
  "i-steth": "0 0 24 24",
  "i-user": "0 0 24 24",
  "i-x": "0 0 24 24",
  "i-play": "0 0 24 24",
  "i-chat": "0 0 24 24",
  "i-ext": "0 0 24 24",
  "i-band": "0 0 24 24",
};

/**
 * The reference sprite's inner markup, verbatim. The symbols declare their own
 * `fill`/`stroke` on exactly the elements that need it (i-logo, i-play);
 * everything else inherits `currentColor` via the CSS `fill` default.
 *
 * Source: پلتفرم/services.html lines 19–57, پلتفرم/index.html line 70.
 * READ-ONLY reference — transcribed, never modified.
 */
const ICONS: Readonly<Record<IconName, JSX.Element>> = {
  "i-eye": (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "i-ear": (
    <>
      <path d="M6 8.5a6 6 0 1 1 12 0c0 3.5-3 4.5-3 7.5a3.5 3.5 0 0 1-6.5 1.8" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.9.8-1.2 1.4-1.2 2.7" />
    </>
  ),
  "i-women": (
    <>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M12 14v8M8.5 18.5h7" />
    </>
  ),
  "i-kidney": (
    <>
      <path d="M9 3.5C5 3.5 3 7 3 11s2 9.5 6 9.5 4-3 3-5.5-.5-3 1-4.5-1-7-4-7Z" />
      <path d="M15 3.5c4 0 6 3.5 6 7.5s-2 9.5-6 9.5" />
    </>
  ),
  "i-bone": (
    <>
      <path d="M8.5 15.5 15.5 8.5" />
      <path d="M15.5 8.5a2.5 2.5 0 1 1 3-3 2.5 2.5 0 1 1-3 3ZM8.5 15.5a2.5 2.5 0 1 1-3 3 2.5 2.5 0 1 1 3-3Z" />
    </>
  ),
  "i-scalpel": (
    <>
      <path d="M3 21 14.5 9.5l3 3L9 21Z" />
      <path d="m14.5 9.5 5-5a2.1 2.1 0 0 1 3 3l-5 5" />
    </>
  ),
  "i-heart": (
    <>
      <path d="M12 20.5S3 15 3 8.8A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 9 2.5C21 15 12 20.5 12 20.5Z" />
      <path d="M3.5 12h4.5l1.5-2.5 3 5 1.5-2.5h6.5" />
    </>
  ),
  "i-laser": (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  "i-hair": (
    <>
      <path d="M5 21v-6a7 7 0 0 1 14 0v6" />
      <path d="M8 10c0-3 1.5-6 4-7M12 9c0-3 1-5 3-6M16 10.5c.3-2.5 1.3-4.5 3-5.5" />
    </>
  ),
  "i-calendar": (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4M8 14h2M14 14h2M8 17.5h2" />
    </>
  ),
  "i-phone": (
    <path d="M5 3.5h3.5l1.8 4.5-2.3 1.5a11 11 0 0 0 6.5 6.5l1.5-2.3 4.5 1.8V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />
  ),
  "i-search": (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.5-4.5" />
    </>
  ),
  "i-doctor": (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      <path d="M15.5 14.5v2.5a1.5 1.5 0 0 0 3 0" />
      <path d="M9 14.2v3.3" />
      <circle cx="9" cy="18.5" r="1" />
    </>
  ),
  "i-clipboard": (
    <>
      <rect x="5" y="4" width="14" height="17.5" rx="2.5" />
      <path d="M9 4V2.8h6V4M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </>
  ),
  "i-shield": (
    <>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  "i-clock": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  "i-upload": (
    <>
      <path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2.5V8h5.5M12 18v-6M9.5 14.5 12 12l2.5 2.5" />
    </>
  ),
  "i-globe": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </>
  ),
  "i-building": (
    <path d="M4 21V5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5V21M16 9.5h2.5A1.5 1.5 0 0 1 20 11v10M2.5 21h19M8 7.5h4M8 11h4M8 14.5h4M9 21v-3h2v3" />
  ),
  "i-bed": (
    <>
      <path d="M3 5v15M3 16h18v4M21 16v-4a3 3 0 0 0-3-3h-7v7" />
      <circle cx="7" cy="11.5" r="2" />
    </>
  ),
  "i-team": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14.5a4.5 4.5 0 0 1 4.5 4.5" />
    </>
  ),
  "i-arrow": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "i-check": <path d="m5 12.5 4.5 4.5L19 7.5" />,
  "i-pin": (
    <>
      <path d="M12 21.5s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  "i-mail": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  "i-insta": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r=".6" />
    </>
  ),
  "i-chev": <path d="m6 9 6 6 6-6" />,
  "i-plus": <path d="M12 5v14M5 12h14" />,
  "i-air": <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" />,
  "i-steril": (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <path d="M7 6V4h10v2M12 10v6M9 13h6" />
    </>
  ),
  "i-layers": (
    <>
      <path d="m12 3 9 5-9 5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  "i-menu": <path d="M4 7h16M4 12h16M4 17h16" />,
  "i-logo": (
    <>
      <path
        d="M24 3 41 12.5v19L24 45 7 31.5v-19Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M17 15v18M17 24l8-9M19.6 21.2 25.5 33M30 15v18M37 15v18M30 24h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </>
  ),
  "i-steth": (
    <>
      <path d="M6 3H5a1 1 0 0 0-1 1v5a5 5 0 0 0 10 0V4a1 1 0 0 0-1-1h-1" />
      <path d="M9 14v1a6 6 0 0 0 12 0v-2" />
      <circle cx="21" cy="11" r="2" />
    </>
  ),
  "i-user": (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  "i-x": <path d="M6 6l12 12M18 6 6 18" />,
  "i-play": <path d="M8 5v14l11-7Z" fill="currentColor" />,
  "i-chat": (
    <>
      <path d="M4 5h16v11H9l-5 4Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  "i-ext": (
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  ),
  "i-band": (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M8 12h5" />
      <circle cx="16.5" cy="12" r="1" />
    </>
  ),
};

export interface IconProps {
  /** The reference symbol id, e.g. "i-phone". */
  name: IconName;
  /** Pixel size of the square viewport; the reference's CSS sizes via em/#39; we keep it explicit. */
  size?: number;
  className?: string;
  /** Accessible label; omit for purely decorative icons (they get aria-hidden). */
  title?: string;
  style?: CSSProperties;
}

/**
 * One inline SVG icon. Defaults to `aria-hidden` because in the reference the
 * surrounding text carries the meaning; pass `title` when the icon stands alone.
 */
export function Icon({ name, size = 24, className, title, style }: IconProps) {
  const viewBox = VIEW_BOX[name];
  const labeled = Boolean(title);
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      style={style}
      role={labeled ? "img" : undefined}
      aria-hidden={labeled ? undefined : true}
      aria-label={labeled ? title : undefined}
      focusable="false"
    >
      {labeled ? <title>{title}</title> : null}
      {ICONS[name]}
    </svg>
  );
}

/**
 * The brand logo glyph. The reference draws it as the i-logo symbol with its
 * own stroke attributes; this is a thin size/className wrapper over the same
 * registry entry so header and footer share one source of truth.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return <Icon name="i-logo" size={size} className={className} />;
}
