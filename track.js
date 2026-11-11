/* track.js — reading analytics for teerth.dev and teerth.blog.
   Loads Microsoft Clarity (time on page, scroll, click/tap heatmaps, recordings)
   and tags what matters: which button was pressed, how far people scrolled,
   how long they actively read. Privacy note: /privacy.html */
(function () {
  var IDS = { "teerth.dev": "CLARITY_ID_DEV", "teerth.blog": "zbqfzqioaj" };
  var host = location.hostname.replace(/^www\./, "");
  var id = IDS[host];
  if (!id || id.indexOf("CLARITY_ID") === 0) return; // not configured yet

  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", id);

  function ev(name) { try { window.clarity("event", name); } catch (e) {} }
  function tag(k, v) { try { window.clarity("set", k, v); } catch (e) {} }

  var path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  var type = path === "/" || path === "/index" ? "home"
           : path === "/work" ? "projects"
           : path === "/privacy" ? "privacy"
           : host === "teerth.blog" ? "essay" : "page";
  tag("page_type", type);

  // Every button / link press, named by what the visitor saw.
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a, button, [data-track]");
    if (!el) return;
    var label = el.getAttribute("data-track") || el.getAttribute("aria-label") ||
                (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    var href = el.getAttribute("href") || "";
    var out = /^https?:/.test(href) && href.indexOf(location.host) < 0;
    ev((out ? "out:" : "click:") + (label || href).slice(0, 60));
    if (/resume|\.pdf/i.test(href)) ev("resume_open");
    if (/^mailto:/.test(href)) ev("email_click");
  }, true);

  // Scroll depth milestones.
  var marks = [25, 50, 75, 100], hit = {};
  var maxScroll = 0;
  function onScroll() {
    var h = document.documentElement;
    var pct = Math.min(100, Math.round((h.scrollTop + innerHeight) / h.scrollHeight * 100));
    if (pct > maxScroll) maxScroll = pct;
    marks.forEach(function (m) { if (pct >= m && !hit[m]) { hit[m] = 1; ev("scroll_" + m); } });
  }
  addEventListener("scroll", onScroll, { passive: true });

  // Active reading time: counts only while the tab is visible and the
  // visitor did something in the last 30 s (scroll, tap, key, mouse).
  var active = 0, last = Date.now(), seen = {};
  ["scroll", "pointerdown", "keydown", "mousemove", "touchstart"].forEach(function (t) {
    addEventListener(t, function () { last = Date.now(); }, { passive: true });
  });
  setInterval(function () {
    if (document.visibilityState !== "visible" || Date.now() - last > 30000) return;
    active += 5;
    [15, 30, 60, 180, 300].forEach(function (s) {
      if (active >= s && !seen[s]) { seen[s] = 1; ev("active_" + s + "s"); }
    });
    // Serious reader: 60 s of active time and 75 % of the page scrolled.
    if (!seen.reader && active >= 60 && maxScroll >= 75) {
      seen.reader = 1; ev("serious_reader"); tag("reader", "serious");
    }
  }, 5000);
})();
