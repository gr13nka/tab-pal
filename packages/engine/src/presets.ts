import { hexToRgb, rgbToLab, labToRgb, rgbToHex } from "./spaces/srgb";
import { lerpLab } from "./perceptual";
import type { Hex, PaletteType } from "./types";

/** Curated preset library, keyed by Tableau palette type. */
export const PRESETS: Record<PaletteType, Record<string, string[]>> = {
  // Qualitative / categorical.
  regular: {
    "Tableau 10": [
      "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
      "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    ],
    "Tableau 20": [
      "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
      "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
      "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
      "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5",
    ],
    "ColorBrewer Set1": [
      "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00",
      "#ffff33", "#a65628", "#f781bf", "#999999",
    ],
    "ColorBrewer Set2": [
      "#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854",
      "#ffd92f", "#e5c494", "#b3b3b3",
    ],
    "ColorBrewer Set3": [
      "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3",
      "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd",
      "#ccebc5", "#ffed6f",
    ],
    Paired: [
      "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99",
      "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a",
      "#ffff99", "#b15928",
    ],
    Dark2: [
      "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e",
      "#e6ab02", "#a6761d", "#666666",
    ],
    Accent: [
      "#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0",
      "#f0027f", "#bf5b17", "#666666",
    ],
    Pastel1: [
      "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6",
      "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2",
    ],
  },
  // Sequential (light -> dark, perceived order).
  "ordered-sequential": {
    Viridis: [
      "#440154", "#472d7b", "#3b528b", "#2c728e", "#21918c",
      "#28ae80", "#5ec962", "#addc30", "#fde725",
    ],
    Magma: [
      "#000004", "#1c1044", "#4f127b", "#812581", "#b5367a",
      "#e55064", "#fb8761", "#fec287", "#fcfdbf",
    ],
    Inferno: [
      "#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60",
      "#cf4446", "#ed6925", "#fb9b06", "#fcffa4",
    ],
    Plasma: [
      "#0d0887", "#46039f", "#7201a8", "#9c179e", "#bd3786",
      "#d8576b", "#ed7953", "#fb9f3a", "#f0f921",
    ],
    Cividis: [
      "#00204d", "#00336f", "#39486b", "#575d6d", "#707173",
      "#8a8779", "#a69d75", "#c4b56c", "#ffea46",
    ],
    "ColorBrewer Blues": [
      "#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6",
      "#4292c6", "#2171b5", "#08519c", "#08306b",
    ],
    "ColorBrewer Greens": [
      "#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476",
      "#41ab5d", "#238b45", "#006d2c", "#00441b",
    ],
    "ColorBrewer Oranges": [
      "#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c",
      "#f16913", "#d94801", "#a63603", "#7f2704",
    ],
    "ColorBrewer Purples": [
      "#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8",
      "#807dba", "#6a51a3", "#54278f", "#3f007d",
    ],
    "ColorBrewer YlGnBu": [
      "#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4",
      "#1d91c0", "#225ea8", "#253494", "#081d58",
    ],
    "ColorBrewer YlOrRd": [
      "#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c",
      "#fc4e2a", "#e31a1c", "#bd0026", "#800026",
    ],
  },
  // Diverging (two sequential arms back to back around a neutral centre).
  "ordered-diverging": {
    RdBu: [
      "#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7",
      "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061",
    ],
    RdYlBu: [
      "#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090",
      "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695",
    ],
    Spectral: [
      "#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b",
      "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2",
    ],
    BrBG: [
      "#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3",
      "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30",
    ],
    PiYG: [
      "#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef",
      "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419",
    ],
    PRGn: [
      "#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8",
      "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b",
    ],
    RdYlGn: [
      "#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b",
      "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837",
    ],
  },
};

export function presetNames(paletteType: PaletteType): string[] {
  return Object.keys(PRESETS[paletteType] ?? {});
}

/** Resample a colour ramp to `n` evenly spaced stops, interpolating in Lab. */
export function resample(colours: string[], n: number): Hex[] {
  if (n <= 0) return [];
  if (n === 1) return [colours[Math.floor(colours.length / 2)]];
  if (colours.length === 1) return new Array<string>(n).fill(colours[0]);

  const labs = colours.map((c) => rgbToLab(hexToRgb(c)));
  const last = labs.length - 1;
  const out: Hex[] = [];
  for (let i = 0; i < n; i++) {
    const pos = (i / (n - 1)) * last;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, last);
    const lab = lerpLab(labs[lo], labs[hi], pos - lo);
    out.push(rgbToHex(labToRgb(lab)));
  }
  return out;
}

/**
 * Fetch a curated preset resized to `n` colours.
 *
 * Qualitative palettes are sliced/cycled (order is meaningless); sequential and
 * diverging palettes are resampled in Lab so the perceived spacing stays even.
 */
export function getPreset(paletteType: PaletteType, name: string, n: number): Hex[] {
  const colours = PRESETS[paletteType][name];
  if (paletteType === "regular") {
    if (n <= colours.length) return colours.slice(0, n);
    return Array.from({ length: n }, (_, i) => colours[i % colours.length]);
  }
  return resample(colours, n);
}
