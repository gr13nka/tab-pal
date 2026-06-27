"""
Stdlib-only colour maths, palette generators and a curated preset library for
TabPal.

Colours are passed around as ``"#rrggbb"`` hex strings (the format Tableau stores
in ``Preferences.tps``).  ``colorsys`` from the standard library only offers
HLS/HSV, which are *not* perceptually uniform, so the generators work in
**CIELAB / LCh** (implemented here from the standard sRGB-D65 formulas).  Working
in LCh is what keeps categorical colours evenly distinct and sequential ramps
perceptually even.
"""

from __future__ import annotations

import math
import random

# ---------------------------------------------------------------------------
# hex <-> rgb
# ---------------------------------------------------------------------------


def hex_to_rgb(hex_code: str) -> tuple[int, int, int]:
    """Convert ``"#rrggbb"`` (or ``"rrggbb"``) to a 0-255 ``(r, g, b)`` tuple."""
    h = hex_code.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert a 0-255 ``(r, g, b)`` to a lowercase ``"#rrggbb"`` string."""
    return "#{:02x}{:02x}{:02x}".format(
        _clamp8(round(r)), _clamp8(round(g)), _clamp8(round(b))
    )


def _clamp8(value: int) -> int:
    return max(0, min(255, value))


# ---------------------------------------------------------------------------
# sRGB <-> linear <-> XYZ (D65) <-> Lab <-> LCh
# ---------------------------------------------------------------------------

# D65 reference white (CIE 1931, 2 degree observer), scaled so Y = 100.
_XN, _YN, _ZN = 95.047, 100.0, 108.883


def _srgb_to_linear(c: float) -> float:
    """Inverse sRGB companding for a single 0-1 channel."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c: float) -> float:
    """Forward sRGB companding for a single 0-1 channel."""
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def rgb_to_xyz(r: int, g: int, b: int) -> tuple[float, float, float]:
    rl = _srgb_to_linear(r / 255)
    gl = _srgb_to_linear(g / 255)
    bl = _srgb_to_linear(b / 255)
    x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) * 100
    y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) * 100
    z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) * 100
    return x, y, z


def xyz_to_rgb(x: float, y: float, z: float) -> tuple[int, int, int]:
    x /= 100
    y /= 100
    z /= 100
    rl = x * 3.2406 + y * -1.5372 + z * -0.4986
    gl = x * -0.9689 + y * 1.8758 + z * 0.0415
    bl = x * 0.0557 + y * -0.2040 + z * 1.0570
    r = _linear_to_srgb(rl) * 255
    g = _linear_to_srgb(gl) * 255
    b = _linear_to_srgb(bl) * 255
    return _clamp8(round(r)), _clamp8(round(g)), _clamp8(round(b))


_DELTA = 6 / 29


def _lab_f(t: float) -> float:
    return t ** (1 / 3) if t > _DELTA ** 3 else t / (3 * _DELTA ** 2) + 4 / 29


def _lab_f_inv(t: float) -> float:
    return t ** 3 if t > _DELTA else 3 * _DELTA ** 2 * (t - 4 / 29)


def xyz_to_lab(x: float, y: float, z: float) -> tuple[float, float, float]:
    fx = _lab_f(x / _XN)
    fy = _lab_f(y / _YN)
    fz = _lab_f(z / _ZN)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def lab_to_xyz(L: float, a: float, b: float) -> tuple[float, float, float]:
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - b / 200
    return _lab_f_inv(fx) * _XN, _lab_f_inv(fy) * _YN, _lab_f_inv(fz) * _ZN


def rgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    return xyz_to_lab(*rgb_to_xyz(r, g, b))


def lab_to_rgb(L: float, a: float, b: float) -> tuple[int, int, int]:
    return xyz_to_rgb(*lab_to_xyz(L, a, b))


def lab_to_lch(L: float, a: float, b: float) -> tuple[float, float, float]:
    c = math.hypot(a, b)
    h = math.degrees(math.atan2(b, a)) % 360
    return L, c, h


def lch_to_lab(L: float, c: float, h: float) -> tuple[float, float, float]:
    rad = math.radians(h)
    return L, c * math.cos(rad), c * math.sin(rad)


# Convenience round-trips between hex and LCh (what the generators speak).


def hex_to_lch(hex_code: str) -> tuple[float, float, float]:
    return lab_to_lch(*rgb_to_lab(*hex_to_rgb(hex_code)))


def lch_to_hex(L: float, c: float, h: float) -> str:
    return rgb_to_hex(*lab_to_rgb(*lch_to_lab(L, c, h)))


# ---------------------------------------------------------------------------
# Perceptual helpers
# ---------------------------------------------------------------------------


def delta_e(lab1: tuple[float, float, float], lab2: tuple[float, float, float]) -> float:
    """CIE76 perceptual distance (euclidean in Lab)."""
    return math.dist(lab1, lab2)


def best_text_color(hex_code: str) -> str:
    """Return ``"#000000"`` or ``"#ffffff"`` for readable text on ``hex_code``."""
    L, _, _ = hex_to_lch(hex_code)
    return "#000000" if L > 60 else "#ffffff"


def _lerp_lab(
    lab1: tuple[float, float, float],
    lab2: tuple[float, float, float],
    f: float,
) -> tuple[float, float, float]:
    """Linearly interpolate between two Lab colours (``f`` in 0..1)."""
    return tuple(a + (b - a) * f for a, b in zip(lab1, lab2))


# ---------------------------------------------------------------------------
# Harmony / palette generators (type-aware)
# ---------------------------------------------------------------------------

# Hue offsets (degrees) added to a base hue for each categorical harmony.
HARMONY_HUES = {
    "complementary": [0, 180],
    "analogous": [-30, 0, 30],
    "triadic": [0, 120, 240],
    "split-complementary": [0, 150, 210],
    "tetradic": [0, 60, 180, 240],
    "monochromatic": [0],
}

MODES_CATEGORICAL = list(HARMONY_HUES.keys())
MODES_SEQUENTIAL = ["single-hue", "multi-hue"]
MODES_DIVERGING = ["two-hue"]


def modes_for(palette_type: str) -> list[str]:
    """Return the valid generation modes for a Tableau palette type."""
    if palette_type == "ordered-sequential":
        return MODES_SEQUENTIAL
    if palette_type == "ordered-diverging":
        return MODES_DIVERGING
    return MODES_CATEGORICAL


def _gamut_chroma(L: float, target: float = 62.0) -> float:
    """Cap chroma so a colour stays roughly inside the sRGB gamut.

    Very light and very dark colours can hold far less chroma than mid colours;
    asking for more just gets clamped on conversion to RGB (which collapses
    distinct hues together).  This tapers the target toward the L extremes.
    """
    return max(28.0, target - max(0.0, abs(L - 55.0) - 8.0) * 1.1)


def _rendered_lab(lch) -> tuple[float, float, float]:
    """Lab of a colour *after* it is rendered to sRGB (i.e. gamut-clamped)."""
    return rgb_to_lab(*lab_to_rgb(*lch_to_lab(*lch)))


def _enforce_min_distance(colors_lch, min_de=12.0, max_tries=32):
    """Nudge later colours so every pair is at least ``min_de`` apart on screen.

    Distance is measured on the rendered (gamut-clamped) colour so the check
    reflects what the user actually sees.  Only used for multi-hue harmonies:
    rotating hue would destroy a monochromatic palette, so that mode opts out.
    """
    for j in range(1, len(colors_lch)):
        for t in range(max_tries):
            labj = _rendered_lab(colors_lch[j])
            if all(
                delta_e(labj, _rendered_lab(colors_lch[i])) >= min_de
                for i in range(j)
            ):
                break
            colors_lch[j][2] = (colors_lch[j][2] + 23) % 360
            # Push lightness alternately darker/lighter to open up more room.
            colors_lch[j][0] = max(
                30.0, min(82.0, colors_lch[j][0] + (8.0 if t % 2 else -8.0))
            )
            colors_lch[j][1] = _gamut_chroma(colors_lch[j][0])


def generate_categorical(n: int, mode: str, base_hue: float | None = None) -> list[str]:
    """Generate ``n`` distinct, equally weighted colours via a harmony scheme.

    Colours are grouped by harmony hue; when more colours are needed than the
    scheme has hues, the extra colours reuse a hue but spread their lightness
    evenly so they stay distinct (this is also exactly how a monochromatic ramp
    is built).
    """
    if base_hue is None:
        base_hue = random.uniform(0, 360)
    offsets = HARMONY_HUES.get(mode, HARMONY_HUES["triadic"])
    k = len(offsets)

    # How many colours land on each harmony hue (round-robin assignment).
    counts = [0] * k
    for i in range(n):
        counts[i % k] += 1
    seen = [0] * k

    # A single hue can safely use the full lightness range; multi-hue schemes
    # keep a tighter band so every colour reads as equally weighted.
    light_hi, light_lo = (90.0, 22.0) if mode == "monochromatic" else (78.0, 38.0)
    colours = []
    for i in range(n):
        g = i % k
        cnt = counts[g]
        pos = seen[g]
        seen[g] += 1
        L = 60.0 if cnt == 1 else light_hi + (light_lo - light_hi) * (pos / (cnt - 1))
        C = _gamut_chroma(L)
        h = (base_hue + offsets[g]) % 360
        colours.append([L, C, h])

    if mode != "monochromatic":
        _enforce_min_distance(colours)
    return [lch_to_hex(*lch) for lch in colours]


def generate_sequential(n: int, mode: str, base_hue: float | None = None) -> list[str]:
    """Generate a light->dark ramp that is perceptually even (linear in Lab L)."""
    if base_hue is None:
        base_hue = random.uniform(0, 360)
    if n == 1:
        return [lch_to_hex(60.0, 45.0, base_hue)]

    light_L, dark_L = 92.0, 30.0
    colours = []
    for i in range(n):
        t = i / (n - 1)  # 0 = lightest, 1 = darkest
        L = light_L + (dark_L - light_L) * t
        C = 12.0 + 52.0 * t  # desaturated at the light end, saturated when dark
        h = (base_hue + 50.0 * t) % 360 if mode == "multi-hue" else base_hue
        colours.append(lch_to_hex(L, C, h))
    return colours


def generate_diverging(n: int, mode: str, base_hue: float | None = None) -> list[str]:
    """Generate two saturated arms diverging from a light neutral centre."""
    if base_hue is None:
        base_hue = random.uniform(0, 360)
    if n == 1:
        return [lch_to_hex(95.0, 2.0, base_hue)]

    end_L, end_C = 50.0, 52.0
    lab1 = lch_to_lab(end_L, end_C, base_hue)
    lab2 = lch_to_lab(end_L, end_C, (base_hue + 180) % 360)
    centre = lch_to_lab(95.0, 2.0, base_hue)

    colours = []
    for i in range(n):
        t = i / (n - 1)  # 0 = arm 1, 0.5 = centre, 1 = arm 2
        if t <= 0.5:
            lab = _lerp_lab(lab1, centre, t / 0.5)
        else:
            lab = _lerp_lab(centre, lab2, (t - 0.5) / 0.5)
        colours.append(rgb_to_hex(*lab_to_rgb(*lab)))
    return colours


def generate(
    palette_type: str, n: int, mode: str, base_hue: float | None = None
) -> list[str]:
    """Dispatch to the generator matching a Tableau palette type."""
    if palette_type == "ordered-sequential":
        return generate_sequential(n, mode, base_hue)
    if palette_type == "ordered-diverging":
        return generate_diverging(n, mode, base_hue)
    return generate_categorical(n, mode, base_hue)


# ---------------------------------------------------------------------------
# Curated preset library (keyed by Tableau palette type)
# ---------------------------------------------------------------------------

PRESETS = {
    # Qualitative / categorical.
    "regular": {
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
        "Paired": [
            "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99",
            "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a",
            "#ffff99", "#b15928",
        ],
        "Dark2": [
            "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e",
            "#e6ab02", "#a6761d", "#666666",
        ],
        "Accent": [
            "#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0",
            "#f0027f", "#bf5b17", "#666666",
        ],
        "Pastel1": [
            "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6",
            "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2",
        ],
    },
    # Sequential (light -> dark, perceived order).
    "ordered-sequential": {
        "Viridis": [
            "#440154", "#472d7b", "#3b528b", "#2c728e", "#21918c",
            "#28ae80", "#5ec962", "#addc30", "#fde725",
        ],
        "Magma": [
            "#000004", "#1c1044", "#4f127b", "#812581", "#b5367a",
            "#e55064", "#fb8761", "#fec287", "#fcfdbf",
        ],
        "Inferno": [
            "#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60",
            "#cf4446", "#ed6925", "#fb9b06", "#fcffa4",
        ],
        "Plasma": [
            "#0d0887", "#46039f", "#7201a8", "#9c179e", "#bd3786",
            "#d8576b", "#ed7953", "#fb9f3a", "#f0f921",
        ],
        "Cividis": [
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
    # Diverging (two sequential arms back to back around a neutral centre).
    "ordered-diverging": {
        "RdBu": [
            "#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7",
            "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061",
        ],
        "RdYlBu": [
            "#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090",
            "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695",
        ],
        "Spectral": [
            "#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b",
            "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2",
        ],
        "BrBG": [
            "#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3",
            "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30",
        ],
        "PiYG": [
            "#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef",
            "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419",
        ],
        "PRGn": [
            "#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8",
            "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b",
        ],
        "RdYlGn": [
            "#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b",
            "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837",
        ],
    },
}


def preset_names(palette_type: str) -> list[str]:
    """Return the curated preset names available for a palette type."""
    return list(PRESETS.get(palette_type, {}).keys())


def resample(colours: list[str], n: int) -> list[str]:
    """Resample a colour ramp to ``n`` evenly spaced stops, interpolating in Lab."""
    if n <= 0:
        return []
    if n == 1:
        return [colours[len(colours) // 2]]
    if len(colours) == 1:
        return [colours[0]] * n

    labs = [rgb_to_lab(*hex_to_rgb(c)) for c in colours]
    last = len(labs) - 1
    out = []
    for i in range(n):
        pos = i / (n - 1) * last
        lo = int(math.floor(pos))
        hi = min(lo + 1, last)
        lab = _lerp_lab(labs[lo], labs[hi], pos - lo)
        out.append(rgb_to_hex(*lab_to_rgb(*lab)))
    return out


def get_preset(palette_type: str, name: str, n: int) -> list[str]:
    """Fetch a curated preset resized to ``n`` colours.

    Qualitative palettes are sliced/cycled (order is meaningless); sequential and
    diverging palettes are resampled in Lab so the perceived spacing stays even.
    """
    colours = PRESETS[palette_type][name]
    if palette_type == "regular":
        if n <= len(colours):
            return list(colours[:n])
        return [colours[i % len(colours)] for i in range(n)]
    return resample(colours, n)
