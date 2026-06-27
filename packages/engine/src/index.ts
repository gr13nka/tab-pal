// Public surface of the tab-pal colour engine.
// Pure, perceptually-uniform (CIELAB/LCh), zero DOM/app dependencies.

export type { Hex, RGB, XYZ, Lab, LCh, PaletteType } from "./types";
export { roundHalfEven, mod360 } from "./math";

export {
  hexToRgb,
  rgbToHex,
  srgbToLinear,
  linearToSrgb,
  rgbToXyz,
  xyzToRgb,
  xyzToLab,
  labToXyz,
  rgbToLab,
  labToRgb,
} from "./spaces/srgb";
export { labToLch, lchToLab } from "./spaces/lch";
export { hexToLab, labToHex, hexToLch, lchToHex } from "./convert";

export { type ColorSpace, registerSpace, getSpace, spaceIds } from "./spaces/registry";

export { deltaE, bestTextColor, lerpLab } from "./perceptual";

export {
  type Rng,
  HARMONY_HUES,
  MODES_CATEGORICAL,
  MODES_SEQUENTIAL,
  MODES_DIVERGING,
  modesFor,
  generateCategorical,
  generateSequential,
  generateDiverging,
  generate,
} from "./generators";

export { PRESETS, presetNames, resample, getPreset } from "./presets";

export {
  type WcagLevel,
  relativeLuminance,
  contrastRatio,
  wcagLevel,
} from "./wcag";
