#!/usr/bin/env python3
"""Generate cross-language parity fixtures from the Python colour engine.

The TS engine (`@tab-pal/engine`) is a port of `tab_pal/colors.py`. This script
runs the *Python* engine (the oracle) over a fixed, deterministic set of inputs
and writes `parity.json`. `parity.test.ts` then asserts the TS port reproduces
these outputs exactly (hex strings) and within 1e-9 (raw Lab floats).

Run from the repo root (works whether the Python app is at the root or archived
under legacy/python-tui):

    python packages/engine/test/fixtures/generate_parity.py
"""
import importlib.util
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))


def load_colors():
    candidates = [
        os.path.join(ROOT, "tab_pal", "colors.py"),
        os.path.join(ROOT, "legacy", "python-tui", "tab_pal", "colors.py"),
    ]
    for path in candidates:
        if os.path.exists(path):
            spec = importlib.util.spec_from_file_location("tabpal_colors", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod, path
    raise FileNotFoundError(
        "could not locate tab_pal/colors.py; checked:\n  " + "\n  ".join(candidates)
    )


colors, src = load_colors()

SAMPLES = [
    "#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000",
    "#808080", "#1f77b4", "#e377c2", "#2ca02c", "#fde725",
]
# Explicit base hues keep generation deterministic (no RNG path is exercised).
BASE_HUES = [0, 20, 30, 45, 90, 137.5, 200, 240, 300, 359]

fixture = {
    "source": os.path.relpath(src, ROOT),
    "rgbToLab": [],
    "hexToLch": [],
    "roundTrip": [],
    "generate": [],
    "getPreset": [],
}

for hex_code in SAMPLES:
    rgb = colors.hex_to_rgb(hex_code)
    fixture["rgbToLab"].append({"hex": hex_code, "lab": list(colors.rgb_to_lab(*rgb))})
    fixture["hexToLch"].append({"hex": hex_code, "lch": list(colors.hex_to_lch(hex_code))})
    fixture["roundTrip"].append({"hex": hex_code, "out": colors.lch_to_hex(*colors.hex_to_lch(hex_code))})

for mode in colors.MODES_CATEGORICAL:
    for base in BASE_HUES:
        for n in (1, 3, 5, 6, 8):
            fixture["generate"].append({
                "type": "regular", "n": n, "mode": mode, "baseHue": base,
                "out": colors.generate("regular", n, mode, base_hue=base),
            })
for mode in colors.MODES_SEQUENTIAL:
    for base in BASE_HUES:
        for n in (1, 3, 5, 9):
            fixture["generate"].append({
                "type": "ordered-sequential", "n": n, "mode": mode, "baseHue": base,
                "out": colors.generate("ordered-sequential", n, mode, base_hue=base),
            })
for mode in colors.MODES_DIVERGING:
    for base in BASE_HUES:
        for n in (1, 3, 5, 9, 11):
            fixture["generate"].append({
                "type": "ordered-diverging", "n": n, "mode": mode, "baseHue": base,
                "out": colors.generate("ordered-diverging", n, mode, base_hue=base),
            })

for ptype, names in colors.PRESETS.items():
    for name in names:
        for n in (1, 3, 4, 5, 9, 12, 14):
            fixture["getPreset"].append({
                "type": ptype, "name": name, "n": n,
                "out": colors.get_preset(ptype, name, n),
            })

out_path = os.path.join(HERE, "parity.json")
with open(out_path, "w") as f:
    json.dump(fixture, f, indent=0)

print(f"wrote {out_path}")
print(f"  source={fixture['source']}")
print(
    f"  rgbToLab={len(fixture['rgbToLab'])} hexToLch={len(fixture['hexToLch'])} "
    f"roundTrip={len(fixture['roundTrip'])} generate={len(fixture['generate'])} "
    f"getPreset={len(fixture['getPreset'])}"
)
