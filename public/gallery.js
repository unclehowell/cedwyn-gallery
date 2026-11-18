/* Cedwyn Gallery v0.2.0: draws the gallery from its own database (data/gallery.json). */
(function () {
  "use strict";
  var root = document.getElementById("gallery");
  var grid = document.getElementById("g-grid");
  var q = document.getElementById("g-q");
  var chips = document.getElementById("g-chips");
  var none = document.getElementById("g-none");
  var more = document.getElementById("g-more");
  var stats = document.getElementById("g-stats");
  var box = document.getElementById("g-box");
  var boxImg = document.getElementById("g-box-img");
  var boxCap = document.getElementById("g-box-cap");
  var boxN = document.getElementById("g-box-n");
  var PAGE = 60, shown = PAGE, db = null, all = [], view = [], current = -1, coll = "all";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function url(src) { return encodeURI(src); }
  function label(i) { return (db.collections && db.collections[i.collection]) || i.collection; }
  function meta(i) { return (i.year ? i.year + " · " : "") + label(i); }

  function drawChips() {
    var counts = {};
    all.forEach(function (i) { counts[i.collection] = (counts[i.collection] || 0) + 1; });
    var html = '<button type="button" data-c="all" aria-pressed="true">All (' + all.length + ")</button>";
    Object.keys(db.collections || {}).forEach(function (k) {
      if (counts[k]) html += '<button type="button" data-c="' + esc(k) + '" aria-pressed="false">' + esc(db.collections[k]) + " (" + counts[k] + ")</button>";
    });
    chips.innerHTML = html;
  }

  function filter() {
    var t = (q.value || "").trim().toLowerCase();
    view = all.filter(function (i) {
      if (coll !== "all" && i.collection !== coll) return false;
      if (!t) return true;
      return (i.title + " " + (i.year || "") + " " + label(i) + " " + (i.tags || []).join(" ") + " " + i.id).toLowerCase().indexOf(t) !== -1;
    });
  }

  function draw() {
    filter();
    var slice = view.slice(0, shown);
    grid.innerHTML = slice.map(function (i, n) {
      return '<figure class="g-card" id="' + esc(i.id) + '"><button type="button" data-n="' + n + '" aria-label="Open ' + esc(i.title) + '">' +
        '<img src="' + esc(url(i.src)) + '" alt="' + esc(i.title) + '" loading="lazy" decoding="async"></button>' +
        "<figcaption>" + esc(i.title) + '<span class="g-meta">' + esc(meta(i)) + "</span></figcaption></figure>";
    }).join("");
    none.hidden = view.length > 0;
    more.hidden = view.length <= shown;
  }

  function open(n) {
    if (n < 0 || n >= view.length) return;
    current = n;
    var i = view[n];
    boxImg.src = url(i.src);
    boxImg.alt = i.title;
    boxN.textContent = (n + 1) + " of " + view.length;
    boxCap.innerHTML = "<strong>" + esc(i.title) + "</strong><br>" + esc(meta(i)) + " · " + esc(i.id) +
      ' · <a href="' + esc(url(i.src)) + '">Open the original file</a>' +
      ' · <a href="/catalogue/?q=' + encodeURIComponent(i.title) + '">Search the catalogue</a>';
    if (!box.open) { if (box.showModal) box.showModal(); else box.setAttribute("open", ""); }
    try { history.replaceState(null, "", "#" + i.id); } catch (e) {}
  }
  function close() {
    if (box.close) box.close(); else box.removeAttribute("open");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  function step(d) { var n = current + d; if (n >= view.length) n = 0; if (n < 0) n = view.length - 1; if (n >= shown) { shown = n + 1; draw(); } open(n); }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-n]");
    if (b) open(+b.getAttribute("data-n"));
  });
  grid.addEventListener("error", function (e) {
    if (e.target.tagName === "IMG") { var f = e.target.closest(".g-card"); if (f) f.hidden = true; }
  }, true);
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-c]");
    if (!b) return;
    coll = b.getAttribute("data-c");
    [].forEach.call(chips.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    shown = PAGE; draw();
  });
  q.addEventListener("input", function () { shown = PAGE; draw(); });
  more.addEventListener("click", function () { shown += PAGE; draw(); });
  box.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b) { var a = b.getAttribute("data-act"); if (a === "close") close(); else step(a === "next" ? 1 : -1); }
    else if (e.target === box) close();
  });
  box.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
  document.addEventListener("keydown", function (e) {
    if (!box.open) return;
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  });

  fetch(root.getAttribute("data-db"), { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      db = d;
      all = d.items || [];
      var held = d.not_served || 0;
      stats.textContent = all.length + " pictures shown" + (held > 0 ? " · " + held + " more listed in the inventory, not served by the site at the last check" : "") +
        (d.verified_utc ? " · checked " + d.verified_utc.slice(0, 10) : "");
      drawChips(); draw();
      var h = location.hash.slice(1);
      if (h) { filter(); var n = view.findIndex(function (i) { return i.id === h; }); if (n >= 0) { shown = Math.max(shown, n + 1); draw(); open(n); } }
    })
    .catch(function () { stats.textContent = "The gallery database could not be loaded. Try again shortly."; });
})();
