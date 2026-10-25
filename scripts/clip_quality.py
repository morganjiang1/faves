"""Pick the best-looking frame of every spot clip and rank each spot's clips.

    python3 scripts/clip_quality.py [city ...]

For each clip in assets/videos/<city>/manifest.json (and its "more" clips) it samples ten
frames, scores each one, saves the best as the clip's poster JPG and records its time as
"posterAt", and stores the clip's score as "quality". A frame scores well when it is bright
but not blown out, colorful, and detailed; it loses points for being mostly black (night
shots) or mostly empty sky. Then node scripts/make-video-index.mjs puts each spot's best
clip first. Needs ffmpeg and Pillow.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
VIDEOS = ROOT / "assets" / "videos"
SAMPLES = 10


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        return float(out.stdout.strip())
    except ValueError:
        return 0.0


def frame(path: Path, t: float, out: Path) -> bool:
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{t:.2f}", "-i", str(path), "-frames:v", "1", "-q:v", "2", str(out)], capture_output=True)
    return r.returncode == 0 and out.exists()


def score(img: Image.Image) -> float:
    small = img.convert("RGB").resize((96, 170))
    hsv = small.convert("HSV")
    h, s, v = [list(c.getdata()) for c in hsv.split()]
    n = len(v)
    luma = ImageStat.Stat(small.convert("L")).mean[0] / 255
    sat = sum(s) / n / 255
    black = sum(1 for x in v if x < 40) / n
    blown = sum(1 for x in v if x > 245) / n
    # Sky: blue-ish hues (about 190-250 degrees), not very saturated, in a smooth area.
    edges = list(small.convert("L").filter(ImageFilter.FIND_EDGES).getdata())
    sky = sum(1 for i in range(n) if 135 <= h[i] <= 178 and s[i] < 150 and v[i] > 110 and edges[i] < 18) / n
    detail = min(1.0, sum(edges) / n / 40)
    balance = 1 - abs(luma - 0.55) * 1.6
    return round(0.35 * sat + 0.3 * balance + 0.35 * detail - 0.9 * black - 0.7 * sky - 0.5 * blown, 4)


def best_frame(path: Path, tmp: Path) -> tuple[float, float, Path | None]:
    d = duration(path)
    best = (-9.0, 0.0, None)
    for k in range(SAMPLES):
        t = max(0.0, d * (k + 0.5) / SAMPLES - 0.05)
        out = tmp / f"f{k}.jpg"
        if not frame(path, t, out):
            continue
        sc = score(Image.open(out))
        if sc > best[0]:
            best = (sc, t, out)
    return best


def run(city: str) -> None:
    folder = VIDEOS / city
    mf = folder / "manifest.json"
    if not mf.exists():
        return
    manifest = json.loads(mf.read_text())
    done = 0
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        for entry in manifest.values():
            for clip in [entry, *entry.get("more", [])]:
                video = folder / clip["video"]
                if not video.exists():
                    continue
                sc, t, img = best_frame(video, tmp)
                if img is None:
                    continue
                poster = folder / (clip.get("poster") or video.with_suffix(".jpg").name)
                Image.open(img).convert("RGB").save(poster, quality=86)
                clip["poster"] = poster.name
                clip["posterAt"] = round(t, 2)
                clip["quality"] = sc
                done += 1
            # The spot's best clip goes first.
            if entry.get("more"):
                clips = [{k: v for k, v in entry.items() if k != "more"}, *[dict(c) for c in entry["more"]]]
                ranked = sorted(clips, key=lambda c: c.get("quality", -9), reverse=True)
                entry.clear()
                entry.update({**ranked[0], "more": ranked[1:]})
    mf.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"{city}: scored {done} clips")


if __name__ == "__main__":
    for c in sys.argv[1:] or sorted(p.name for p in VIDEOS.iterdir() if p.is_dir()):
        run(c)
