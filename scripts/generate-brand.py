"""Generate outlined brand assets; Fredoka is a design input, never an app resource.

Requires fontTools 4.67.0 and uharfbuzz 0.57.0 in the design environment.
Usage: python scripts/generate-brand.py --font /path/to/Fredoka.ttf
"""

import argparse
import hashlib
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

import fontTools
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.svgLib.path import parse_path


ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets/brand"
REVISION = "e7db6ca603fd4862010383ff17ffd6cc4ffac1c0"
FONT_SHA = "2ba02e68b152868aef9ba28e24b3648c7d457fe6f25c761f2c2c53fb61a73fc8"
LICENSE_SHA = "5c9e7eee5c6b25f4b05b8d53b2e470ea4962f9ced742d044a98f7d95d1375bab"
TEXT = "Makudon Shuttle"
ICON_SHA = "a2970c992f1ecb559fa4c1d032106092ac59f17dfc4a16ccbfa3880ede00bae7"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def svg(width, height, content, description):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.4f} {height:.4f}" '
        'fill="currentColor" role="img" aria-labelledby="title desc">\n'
        f'  <title id="title">{TEXT}</title>\n'
        f'  <desc id="desc">{description}</desc>\n'
        f'{content}\n</svg>\n'
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", required=True, type=Path)
    args = parser.parse_args()
    font_data = args.font.read_bytes()
    if sha(font_data) != FONT_SHA:
        raise ValueError("Fredoka source hash differs from the pinned Makudon source")
    license_data = (ROOT / "docs/licenses/fredoka-OFL.txt").read_bytes()
    if sha(license_data) != LICENSE_SHA:
        raise ValueError("Fredoka license hash differs from the pinned source")

    font = instantiateVariableFont(TTFont(args.font), {"wght": 600, "wdth": 100})
    # Shape against the original variable font at the same axes; no font is saved.
    hb_font = hb.Font(hb.Face(font_data))
    hb_font.set_variations({"wght": 600, "wdth": 100})
    hb.ot_font_set_funcs(hb_font)
    buffer = hb.Buffer()
    buffer.add_str(TEXT)
    buffer.guess_segment_properties()
    hb.shape(hb_font, buffer, {"kern": True})
    glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
    paths, bounds, advance = [], [], 0
    for info, pos in zip(buffer.glyph_infos, buffer.glyph_positions):
        glyph = glyphs[order[info.codepoint]]
        pen, bp = SVGPathPen(glyphs), BoundsPen(glyphs)
        glyph.draw(pen)
        glyph.draw(bp)
        x, y = advance + pos.x_offset, pos.y_offset
        if bp.bounds:
            a, b, c, d = bp.bounds
            bounds.append((a + x, b + y, c + x, d + y))
            paths.append(f'    <path transform="translate({x} {y})" d="{pen.getCommands()}"/>')
        advance += pos.x_advance + 4
    x0, y0 = min(b[0] for b in bounds), min(b[1] for b in bounds)
    x1, y1 = max(b[2] for b in bounds), max(b[3] for b in bounds)
    scale = 64 / font["head"].unitsPerEm
    width, height = (x1 - x0) * scale, (y1 - y0) * scale
    word = (
        f'  <g transform="translate({-x0 * scale:.4f} {y1 * scale:.4f}) scale({scale} {-scale})">\n'
        + "\n".join(paths) + "\n  </g>"
    )
    wordmark = svg(width, height, word, "Outlined Fredoka Semibold, wght 600, wdth 100; kerning and 4 font units tracking. Transparent background.")

    original = (BRAND / "source/makudon-shuttle-icon.svg").read_bytes()
    if sha(original) != ICON_SHA:
        raise ValueError("Main logo changed; review its geometry before updating the source hash")
    root = ET.fromstring(original)
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    icon_group = root[0]
    # The supplied logo uses one translated group with round-stroked paths.
    # Derive painted bounds from those paths instead of retaining old-logo dimensions.
    translate = re.fullmatch(r"translate\(([-\d.]+)\s+([-\d.]+)\)", icon_group.get("transform", ""))
    if not translate:
        raise ValueError("Expected the supplied logo's translation transform")
    tx, ty = map(float, translate.groups())
    icon_bounds = []
    for path in icon_group:
        bp = BoundsPen(None)
        parse_path(path.get("d"), bp)
        a, b, c, d = bp.bounds
        radius = float(path.get("stroke-width")) / 2
        icon_bounds.append((a - radius + tx, b - radius + ty, c + radius + tx, d + radius + ty))
    icon_group.set("stroke", "currentColor")
    icon_body = ET.tostring(icon_group, encoding="unicode")
    vx, vy, vw, vh = map(float, root.get("viewBox").split())
    if (vx, vy) != (0, 0):
        raise ValueError("Expected a zero-origin source viewBox")
    icon = svg(vw, vh, "  " + icon_body, "Current Shuttle logo geometry, translation, stroke widths and round caps. Themeable; transparent background.")
    a = min(bound[0] for bound in icon_bounds)
    b = min(bound[1] for bound in icon_bounds)
    c = max(bound[2] for bound in icon_bounds)
    d = max(bound[3] for bound in icon_bounds)
    lock_height, gap = 56, 16
    offset = c - a + gap
    icon_y = lock_height / 2 - (b + d) / 2
    lock_body = (
        f'  <g transform="translate({-a:.4f} {icon_y:.4f})">{icon_body}</g>\n'
        f'  <g transform="translate({offset:.4f} {(lock_height - height) / 2:.4f})">\n{word}\n  </g>'
    )
    lockup = svg(offset + width, lock_height, lock_body, "Original Shuttle icon with outlined Fredoka Semibold wordmark. Transparent, single-color horizontal lockup.")
    outputs = {
        "assets/brand/makudon-shuttle-icon.svg": icon,
        "assets/brand/makudon-shuttle-wordmark.svg": wordmark,
        "assets/brand/makudon-shuttle-lockup.svg": lockup,
        "assets/readme/makudon-shuttle-lockup-light.svg": lockup.replace("currentColor", "#272827"),
        "assets/readme/makudon-shuttle-lockup-dark.svg": lockup.replace("currentColor", "#E0E3DD"),
    }
    for name, data in outputs.items():
        (ROOT / name).write_text(data, encoding="utf-8", newline="\n")
    provenance = {
        "date": "2026-11-28",
        "status": "outlined assets and README integrated; native app not implemented",
        "reference": "Makudon assets/brand/README.md and provenance.json; Codex chat 讨论界面风格与美术设计",
        "font": {
            "name": "Fredoka", "author": "The Fredoka Project Authors",
            "homepage": "https://fonts.google.com/specimen/Fredoka",
            "revision": REVISION,
            "source": f"https://raw.githubusercontent.com/google/fonts/{REVISION}/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf",
            "source_sha256": FONT_SHA, "source_bytes": len(font_data),
            "license": "SIL OFL 1.1",
            "license_source": f"https://raw.githubusercontent.com/google/fonts/{REVISION}/ofl/fredoka/OFL.txt",
            "license_sha256": LICENSE_SHA,
            "font_file_committed": False, "font_embedded_in_app": False,
        },
        "wordmark": {
            "text": TEXT, "axes": {"wght": 600, "wdth": 100},
            "tracking_font_units": 4, "em_size": 64,
            "shaping": "HarfBuzz Latin left-to-right, kern enabled, default ligatures",
            "glyph_modifications": "none; bounds normalization and subtle tracking only",
            "viewBox": [0, 0, round(width, 4), round(height, 4)],
        },
        "icon": {
            "source": "source/makudon-shuttle-icon.svg",
            "original_filename": "makudon-shuttle-logo.svg",
            "original_sha256": sha(original),
            "changes": "replacement source moved byte-for-byte; themeable derivative changes only stroke color and SVG metadata",
            "viewBox": [vx, vy, vw, vh],
            "painted_bounds": [a, b, c, d],
        },
        "lockup": {"icon_scale": 1, "gap": gap, "height": lock_height, "alignment": "painted bounds centered vertically"},
        "tools": {"fonttools": fontTools.__version__, "uharfbuzz": hb.__version__},
        "outputs_sha256": {name: sha(data.encode("utf-8")) for name, data in outputs.items()},
    }
    (BRAND / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"wordmark": [width, height], "lockup": [offset + width, lock_height], "outputs": len(outputs)}))


if __name__ == "__main__":
    main()
