# Gallery changelog

## 0.2.0 — 18 Nov 2026
- A real image gallery in `public/`: 141 pictures of Tŷ Mawr (Great House Farm), Llandough-juxta-Penarth, drawn from the app's own database `public/data/gallery.json`.
- The database is built by `tools/build_gallery_db.py` from the Wayback image inventory (`unclehowell/cedwyn-wayback`, `wayback/images/_treeview.json`). Titles as the inventory gives them. No image file is copied: each picture loads from `/wayback/images/…`.
- `--verify` checks every listed picture against the live site; only those answering with an image are shown. 246 of 387 listed pictures were not served at the 18 Nov check and are counted, not shown as broken images.
- Left out: the `facebook` set, and pages that show private individuals' names, signatures or personal papers (petition signature sheets, a membership card, an index search, a certificate, a census page). They stay in their owning collection.
- Search, collection chips, full-size viewer with previous / next, arrow keys, Esc, deep links (`#G-0001`), lazy loading, light and dark themes. Checked at 390 px and 1280 px: no sideways scroll, no script errors.
- The old link-card page at the repository root is kept for history; the site build should publish `public/` only (see `SITE-WIRING.md`).

## 0.1.1 — 7 Nov 2026
- Date fix commit 22671a1 (see cedwyn#502).

## 0.1.0 — 28 Oct 2026
- First candidate: a page of six link cards to other collections.
