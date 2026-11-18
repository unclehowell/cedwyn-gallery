# Wiring the Gallery into the site build

`/gallery/` answers 404 because the main build (`tools/assemble.py`) has no `gallery` theme. `split-repos.json` already lists
Gallery as `mode: split-repo`, `deploy: repo`, so the build clones this repository; it only needs a theme entry, and that entry
must name `public/` as the output directory. Without `"dir": "public"` the build would copy the whole repository
(3,700+ files, most of them copies of other apps under `web/`) and push the Pages deploy over its 20,000-file limit.

`public/` holds 4 files (about 43 KB).

## The one change on main (site-wide; the owner merges)
Add to `themes.json` → `themes`:

```json
{
  "id": "gallery",
  "title": "Gallery",
  "cy": "Oriel",
  "es": "Galería",
  "live": "https://bucklerfamily.estate/gallery/",
  "hosts": [],
  "paths": [],
  "dir": "public",
  "desc": "Photographs, maps, scans and press images of Tŷ Mawr (Great House Farm), Llandough-juxta-Penarth, in one searchable gallery. Each picture loads from the collection that holds it.",
  "group": "artifacts"
}
```

Then a carousel slot in `data/site-areas.json` (the live list has no gallery slot; slot allocation belongs to the nav issue).

## Acceptance
- `/gallery/` returns 200 and shows the picture count line.
- The build report for `gallery` shows `files: 4`.
- 390 px: no sideways scroll; tapping a picture opens the viewer.

## Refreshing the database
```
python3 tools/build_gallery_db.py --verify
```
