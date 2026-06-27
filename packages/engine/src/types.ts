/** A `#rrggbb` colour string (lowercase). */
export type Hex = string;

/** 0-255 sRGB channels. */
export type RGB = readonly [number, number, number];

/** CIE XYZ (D65), scaled so Y = 100. */
export type XYZ = readonly [number, number, number];

/** CIELAB: L* (0-100), a*, b*. */
export type Lab = readonly [number, number, number];

/** CIE LCh: L*, C* (chroma), h (hue in degrees, 0-360). */
export type LCh = readonly [number, number, number];

/** Tableau-style palette categories that drive generation and preset selection. */
export type PaletteType = "regular" | "ordered-sequential" | "ordered-diverging";
