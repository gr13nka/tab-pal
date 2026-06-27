import { mod360 } from "../math";
import type { Lab, LCh } from "../types";

export function labToLch(lab: Lab): LCh {
  const c = Math.hypot(lab[1], lab[2]);
  const h = mod360((Math.atan2(lab[2], lab[1]) * 180) / Math.PI);
  return [lab[0], c, h];
}

export function lchToLab(lch: LCh): Lab {
  const rad = (lch[2] * Math.PI) / 180;
  return [lch[0], lch[1] * Math.cos(rad), lch[1] * Math.sin(rad)];
}
