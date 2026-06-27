import type { Lab } from "../types";

/**
 * Extension seam for additional colour spaces (OKLab/OKLCh, Display-P3, …).
 *
 * CIELAB is the canonical perceptual hub: every space maps to/from Lab, so
 * generators and the domain `Color` never need to change when a space is added.
 * v1 registers only `cielab`; new spaces drop in via `registerSpace` with no
 * changes to existing callers.
 */
export interface ColorSpace<Coords extends readonly number[] = readonly number[]> {
  readonly id: string;
  toLab(coords: Coords): Lab;
  fromLab(lab: Lab): Coords;
  readonly gamut?: "srgb" | "display-p3";
}

const registry = new Map<string, ColorSpace>();

export function registerSpace(space: ColorSpace): void {
  registry.set(space.id, space);
}

export function getSpace(id: string): ColorSpace | undefined {
  return registry.get(id);
}

export function spaceIds(): string[] {
  return [...registry.keys()];
}

const cielab: ColorSpace = {
  id: "cielab",
  toLab: (coords) => [coords[0], coords[1], coords[2]],
  fromLab: (lab) => [lab[0], lab[1], lab[2]],
  gamut: "srgb",
};

registerSpace(cielab);
