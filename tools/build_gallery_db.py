#!/usr/bin/env python3
"""Build public/data/gallery.json, the Gallery's own small database.

Source: the image inventory of the Wayback app (unclehowell/cedwyn-wayback,
wayback/images/_treeview.json). The Gallery copies no image files: every entry
points at the file already served under /wayback/images/. Titles are taken as
written in the inventory; nothing is added or interpreted here.

Excluded: the 'facebook' set (social-media copies that can show people outside
the family) and anything that is not a raster image.

With --verify, every picture is checked against https://bucklerfamily.estate<src>;
only those answering with an image are listed, and the rest are counted in
"not_served" (without --verify, the pictures listed last time are kept). The page
never draws a broken picture.

Usage: python3 tools/build_gallery_db.py [--verify] [path-or-url-to-_treeview.json]
"""
import json, re, sys, urllib.request, urllib.parse, datetime, pathlib
from concurrent.futures import ThreadPoolExecutor

SITE = "https://bucklerfamily.estate"

SRC = "https://raw.githubusercontent.com/unclehowell/cedwyn-wayback/main/wayback/images/_treeview.json"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "data" / "gallery.json"
# Left out on purpose: pages that show private individuals' names, signatures or
# personal papers (petition signature sheets, membership cards, index searches,
# certificates). They stay in their owning collection; the gallery does not
# give them a second, more prominent home.
PRIVATE = re.compile(r"signatures|membership card|death index|oath of allegiance|census page", re.I)
IMG = re.compile(r"\.(jpe?g|png|webp|gif)$", re.I)


def load(src):
    if re.match(r"https?://", src):
        with urllib.request.urlopen(src, timeout=60) as r:
            return json.load(r)
    return json.load(open(src, encoding="utf-8"))


def collection(path):
    m = re.search(r"Great House Farm Part (\d)", path)
    if m:
        return "album-" + m.group(1)
    if path.startswith("images/evidence/"):
        return "evidence"
    if "marconi" in path.lower():
        return "evidence"
    return "case-papers"


def year(path):
    m = re.match(r"images/(?:evidence/)?(\d{4})-\d{2}-\d{2}", path)
    # Dates of 2025 or later in a file name are upload dates, not the date of the
    # picture, so they are not shown as its year.
    if m and m.group(1) != "0000" and int(m.group(1)) < 2025:
        return int(m.group(1))
    return None


def served(src):
    req = urllib.request.Request(SITE + urllib.parse.quote(src), method="HEAD",
                                 headers={"User-Agent": "Mozilla/5.0 (cedwyn-gallery-build/0.2)"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200 and r.headers.get("Content-Type", "").startswith("image/")
    except Exception:
        return False


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    verify = "--verify" in sys.argv
    src = args[0] if args else SRC
    prev = {}
    if OUT.exists():
        try:
            prev = {i["src"]: True for i in json.load(open(OUT))["items"]}
        except Exception:
            prev = {}
    tree = load(src)
    seen, items = set(), []
    for x in tree:
        p = (x.get("path") or "").strip()
        if not p or not IMG.search(p) or p in seen:
            continue
        if p.startswith("images/facebook/") or "facebook" in (x.get("tags") or []):
            continue
        if PRIVATE.search(x.get("title") or ""):
            continue
        seen.add(p)
        items.append({
            "id": "G-%04d" % (len(items) + 1),
            "src": "/wayback/" + p,
            "title": (x.get("title") or "").strip() or "Untitled image",
            "collection": collection(p),
            "year": year(p),
            "tags": [t for t in (x.get("tags") or []) if t],
        })
    order = {"evidence": 0, "case-papers": 1, "album-1": 2, "album-2": 3, "album-3": 4}
    items.sort(key=lambda i: (order.get(i["collection"], 9), i["year"] or 9999, i["src"]))
    for n, i in enumerate(items, 1):
        i["id"] = "G-%04d" % n
    if verify:
        with ThreadPoolExecutor(12) as ex:
            for i, ok in zip(items, ex.map(lambda i: served(i["src"]), items)):
                i["served"] = ok
    else:
        for i in items:
            i["served"] = prev.get(i["src"], False)
    db = {
        "schema": "cedwyn-gallery/1",
        "generated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": SRC if src == SRC else src,
        "rule": "Index only: each image is served by its owning collection under /wayback/images/. No file is copied here.",
        "collections": {
            "evidence": "Evidence images",
            "case-papers": "Case papers and press",
            "album-1": "Farm album 1",
            "album-2": "Farm album 2",
            "album-3": "Farm album 3",
        },
        "count": len(items),
        "served": sum(1 for i in items if i["served"]),
        "verified_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if verify else None,
        "items": items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Only served pictures are listed item by item; the rest are counted, so the
    # page never draws a broken image and the file stays small.
    db["not_served"] = db["count"] - db["served"]
    db["items"] = [i for i in items if i["served"]]
    for i in db["items"]:
        del i["served"]
    OUT.write_text(json.dumps(db, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(items)} images)")


if __name__ == "__main__":
    main()
