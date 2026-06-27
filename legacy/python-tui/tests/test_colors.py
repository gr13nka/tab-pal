"""Tests for the stdlib-only colour maths, generators and presets.

Runnable with ``pytest`` or directly with ``python tests/test_colors.py``.
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tab_pal import colors

HEX = re.compile(r"^#[0-9a-f]{6}$")

SAMPLES = [
    "#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000",
    "#808080", "#1f77b4", "#e377c2", "#2ca02c", "#fde725",
]


def _min_delta_e(palette):
    labs = [colors.rgb_to_lab(*colors.hex_to_rgb(c)) for c in palette]
    n = len(labs)
    return min(
        colors.delta_e(labs[i], labs[j]) for i in range(n) for j in range(i + 1, n)
    )


def test_hex_rgb_roundtrip():
    for hex_code in SAMPLES:
        assert colors.rgb_to_hex(*colors.hex_to_rgb(hex_code)) == hex_code


def test_lch_roundtrip_is_lossless():
    # Lab/LCh conversion should round-trip back to the exact same sRGB byte.
    for hex_code in SAMPLES:
        assert colors.lch_to_hex(*colors.hex_to_lch(hex_code)) == hex_code


def test_best_text_color():
    assert colors.best_text_color("#ffffff") == "#000000"
    assert colors.best_text_color("#000000") == "#ffffff"


def test_categorical_is_valid_and_distinct():
    # Multi-hue harmonies should keep every colour perceptibly distinct.
    for mode in colors.MODES_CATEGORICAL:
        if mode == "monochromatic":
            continue  # single-hue ramps are intentionally close at high counts
        for base in range(0, 360, 30):
            pal = colors.generate("regular", 6, mode, base_hue=base)
            assert len(pal) == 6
            assert all(HEX.match(c) for c in pal)
            assert _min_delta_e(pal) >= 10.0, (mode, base)


def test_sequential_lightness_is_monotonic():
    for mode in colors.MODES_SEQUENTIAL:
        pal = colors.generate("ordered-sequential", 8, mode, base_hue=240)
        light = [colors.hex_to_lch(c)[0] for c in pal]
        assert all(light[i] > light[i + 1] for i in range(len(light) - 1))
        assert all(HEX.match(c) for c in pal)


def test_diverging_centre_is_lightest():
    pal = colors.generate("ordered-diverging", 9, "two-hue", base_hue=20)
    light = [colors.hex_to_lch(c)[0] for c in pal]
    assert light[len(light) // 2] == max(light)  # neutral centre is lightest
    assert all(HEX.match(c) for c in pal)


def test_presets_resize_correctly():
    # Qualitative presets slice/cycle; sequential & diverging resample.
    assert colors.get_preset("regular", "Tableau 10", 4) == [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"
    ]
    assert len(colors.get_preset("regular", "Tableau 10", 14)) == 14
    for n in (3, 5, 9, 12):
        ramp = colors.get_preset("ordered-sequential", "Viridis", n)
        assert len(ramp) == n and all(HEX.match(c) for c in ramp)
        div = colors.get_preset("ordered-diverging", "RdBu", n)
        assert len(div) == n and all(HEX.match(c) for c in div)


def test_modes_for_each_type():
    assert colors.modes_for("regular") == colors.MODES_CATEGORICAL
    assert colors.modes_for("ordered-sequential") == colors.MODES_SEQUENTIAL
    assert colors.modes_for("ordered-diverging") == colors.MODES_DIVERGING


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"PASS {name}")
            except AssertionError as exc:
                failures += 1
                print(f"FAIL {name}: {exc}")
    sys.exit(1 if failures else 0)
