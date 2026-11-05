#!/usr/bin/env python3
"""Dev-only: extract glyph outlines to glyphs.json so build.mjs needs no fonts or deps.
Run again only if a new character is needed. Requires: pip install fonttools (all fonts are OFL)."""
import json, string
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ASCII = string.ascii_letters + string.digits + string.punctuation + " "
F = "/usr/share/fonts/"
FONTS = {  # key: (path, variable axes, characters)
    "s": (F + "inter-tight/InterTight[wght].ttf", {"wght": 600}, ASCII),
    "b": (F + "ibm-plex-sans/IBMPlexSans[wdth,wght].ttf", {"wght": 400, "wdth": 100}, ASCII),
    "m": (F + "ibm-plex-mono/IBMPlexMono-Regular.ttf", None, ASCII + "·"),
    "d": (F + "sofia-sans-extra-condensed/SofiaSansExtraCondensed[wght].ttf", {"wght": 600}, "0123456789.k"),
}

out = {}
for key, (path, axes, chars) in FONTS.items():
    font = TTFont(path)
    if axes:
        font = instancer.instantiateVariableFont(font, axes)
    cmap, gs = font.getBestCmap(), font.getGlyphSet()
    glyphs = {}
    for ch in chars:
        name = cmap[ord(ch)]  # KeyError here means the font lacks the glyph: fail loudly
        pen = SVGPathPen(gs, ntos=lambda v: str(round(v)))
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))
        glyphs[ch] = {"a": round(gs[name].width), "d": pen.getCommands()}
    out[key] = {"upm": font["head"].unitsPerEm, "glyphs": glyphs}
Path(__file__).with_name("glyphs.json").write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
