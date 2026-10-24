"""Side-by-side check: a reference screenshot next to our screenshot at the same height.

    python3 scripts/side_by_side.py <name> <reference image> <our screenshot> [--crop x0,y0,x1,y1]

--crop cuts the phone screen out of an App Store marketing frame (pixels in the reference
file). Writes docs/screens/pairs/<name>.png. Reference images stay local (references/ is
not committed); the pairs folder is local too (see .gitignore).
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
args = sys.argv[1:]
name, ref_path, ours_path = args[0], args[1], args[2]
crop = None
if "--crop" in args:
    crop = tuple(int(v) for v in args[args.index("--crop") + 1].split(","))

ref = Image.open(ref_path).convert("RGB")
if crop:
    ref = ref.crop(crop)
ours = Image.open(ours_path).convert("RGB")
H = 1400
def fit(im):
    w = round(im.width * H / im.height)
    return im.resize((w, H), Image.LANCZOS)
a, b = fit(ref), fit(ours)
gap, top = 40, 60
out = Image.new("RGB", (a.width + b.width + gap * 3, H + top + gap), "white")
out.paste(a, (gap, top))
out.paste(b, (a.width + gap * 2, top))
d = ImageDraw.Draw(out)
d.text((gap, 20), f"REFERENCE: {Path(ref_path).name}", fill="black")
d.text((a.width + gap * 2, 20), f"FAVES: {Path(ours_path).name}", fill="black")
dest = root / "docs" / "screens" / "pairs"
dest.mkdir(parents=True, exist_ok=True)
out.save(dest / f"{name}.png")
print(dest / f"{name}.png")
