import { roundHalfEven } from "../math";
import type { Hex, RGB, XYZ, Lab } from "../types";

// D65 reference white (CIE 1931, 2° observer), scaled so Y = 100.
const XN = 95.047;
const YN = 100.0;
const ZN = 108.883;

const DELTA = 6 / 29;

export function hexToRgb(hex: Hex): RGB {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function clamp8(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function toHexByte(value: number): string {
  return value.toString(16).padStart(2, "0");
}

export function rgbToHex(rgb: RGB): Hex {
  return (
    "#" +
    toHexByte(clamp8(roundHalfEven(rgb[0]))) +
    toHexByte(clamp8(roundHalfEven(rgb[1]))) +
    toHexByte(clamp8(roundHalfEven(rgb[2])))
  );
}

/** Inverse sRGB companding for a single 0-1 channel. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Forward sRGB companding for a single 0-1 channel. */
export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

export function rgbToXyz(rgb: RGB): XYZ {
  const rl = srgbToLinear(rgb[0] / 255);
  const gl = srgbToLinear(rgb[1] / 255);
  const bl = srgbToLinear(rgb[2] / 255);
  const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) * 100;
  const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) * 100;
  const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) * 100;
  return [x, y, z];
}

export function xyzToRgb(xyz: XYZ): RGB {
  const x = xyz[0] / 100;
  const y = xyz[1] / 100;
  const z = xyz[2] / 100;
  const rl = x * 3.2406 + y * -1.5372 + z * -0.4986;
  const gl = x * -0.9689 + y * 1.8758 + z * 0.0415;
  const bl = x * 0.0557 + y * -0.204 + z * 1.057;
  return [
    clamp8(roundHalfEven(linearToSrgb(rl) * 255)),
    clamp8(roundHalfEven(linearToSrgb(gl) * 255)),
    clamp8(roundHalfEven(linearToSrgb(bl) * 255)),
  ];
}

function labF(t: number): number {
  return t > Math.pow(DELTA, 3)
    ? Math.pow(t, 1 / 3)
    : t / (3 * Math.pow(DELTA, 2)) + 4 / 29;
}

function labFInv(t: number): number {
  return t > DELTA ? Math.pow(t, 3) : 3 * Math.pow(DELTA, 2) * (t - 4 / 29);
}

export function xyzToLab(xyz: XYZ): Lab {
  const fx = labF(xyz[0] / XN);
  const fy = labF(xyz[1] / YN);
  const fz = labF(xyz[2] / ZN);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToXyz(lab: Lab): XYZ {
  const fy = (lab[0] + 16) / 116;
  const fx = fy + lab[1] / 500;
  const fz = fy - lab[2] / 200;
  return [labFInv(fx) * XN, labFInv(fy) * YN, labFInv(fz) * ZN];
}

export function rgbToLab(rgb: RGB): Lab {
  return xyzToLab(rgbToXyz(rgb));
}

export function labToRgb(lab: Lab): RGB {
  return xyzToRgb(labToXyz(lab));
}
