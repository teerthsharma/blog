/* track.js v2 — reading analytics for teerth.dev and teerth.blog.
   Microsoft Clarity records time, scroll, click/tap heatmaps and recordings.
   On top of that this file tags each visit with:
     - which button/link was pressed and whether it moved down the funnel
     - per-section attention (which PR card / project / essay heading held them)
     - reading pattern: skimmer / reader / studier, from scroll speed,
       pauses, re-reads and text copying
     - visitor kind: human / ai_agent / automation
     - company network (from the IP's registered organisation) and entry source
   Privacy note: /privacy */
(function () {
  var IDS = { "teerth.dev": "zbqioxk03q", "teerth.blog": "zbqfzqioaj" };
  var host = location.hostname.replace(/^www\./, "");
  var id = IDS[host];
  if (!id) return;

  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", id);

  function ev(n) { try { window.clarity("event", n); } catch (e) {} }
  function tag(k, v) { try { window.clarity("set", k, String(v).slice(0, 80)); } catch (e) {} }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- page + entry source ---------- */
  var path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  var type = path === "/" || path === "/index" ? "home" : path === "/work" ? "projects"
           : path === "/privacy" ? "privacy" : host === "teerth.blog" ? "essay" : "page";
  tag("page_type", type);
  if (!ss("tk_entry")) {
    ss("tk_entry", "1");
    var ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct";
    if (ref === host) ref = "internal";
    tag("entry_ref", ref);
    tag("entry_page", path);
    if (/^#(pr|p)-/.test(location.hash)) tag("entry_shortlink", location.hash.slice(1));
    var u = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (u.get(k)) tag(k, u.get(k)); });
  }

  /* ---------- visitor kind: human / ai_agent / automation ---------- */
  var ua = navigator.userAgent || "";
  var aiUA = /(GPTBot|ChatGPT|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|anthropic|PerplexityBot|Perplexity-User|Google-Extended|Bytespider|CCBot|cohere|MistralAI|YouBot|DuckAssistBot|Amazonbot|Meta-ExternalAgent|Applebot)/i;
  var botUA = /(bot|crawler|spider|HeadlessChrome|Lighthouse|PhantomJS|Puppeteer|Playwright|Selenium)/i;
  var kind = aiUA.test(ua) ? "ai_agent" : (navigator.webdriver || botUA.test(ua)) ? "automation" : "human";
  tag("visitor_kind", kind);
  if (kind !== "human") ev("visitor_" + kind);

  /* ---------- company network (organisation that owns the IP) ---------- */
  var KNOWN = /(google|alphabet|deepmind|microsoft|meta|facebook|nvidia|amazon|aws|apple|intel|amd|openai|anthropic|ibm|oracle|salesforce|adobe|netflix|uber|stripe|tesla|qualcomm|samsung|tcs|tata|infosys|wipro|accenture|deloitte|goldman|jpmorgan|morgan stanley|university|institute|iit|mit|stanford|eth|cern|research)/i;
  var ISP = /(jio|airtel|bharti|vodafone|idea|bsnl|act fibernet|hathway|comcast|verizon|at&t|t-mobile|charter|spectrum|cox|telstra|bt |sky|orange|telefonica|vi |you broadband|tikona|excitel)/i;
  var CLOUD = /(amazon|aws|google cloud|microsoft azure|digitalocean|linode|akamai|ovh|hetzner|cloudflare|oracle cloud|alibaba|vultr|fastly)/i;
  function orgTag(org, country, city) {
    if (!org) return;
    tag("org", org); if (country) tag("geo", country + (city ? "/" + city : ""));
    var k = CLOUD.test(org) && kind === "human" ? "cloud_network" : KNOWN.test(org) && !ISP.test(org) ? "known_org" : ISP.test(org) ? "home_isp" : "other_org";
    tag("org_kind", k);
    if (k === "known_org") ev("known_org");
    if (k === "cloud_network") ev("cloud_network");
  }
  var cached = ss("tk_org");
  if (cached) { try { var c0 = JSON.parse(cached); orgTag(c0.o, c0.c, c0.t); } catch (e) {} }
  else if (window.fetch) {
    fetch("https://ipapi.co/json/").then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.org) return { o: j.org, c: j.country_name, t: j.city }; throw 0; })
      .catch(function () {
        return fetch("https://ipwho.is/").then(function (r) { return r.json(); })
          .then(function (j) { return { o: j.connection && (j.connection.org || j.connection.isp), c: j.country, t: j.city }; });
      })
      .then(function (d) { if (d && d.o) { ss("tk_org", JSON.stringify(d)); orgTag(d.o, d.c, d.t); } })
      .catch(function () {});
  }

  /* ---------- presses + funnel ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a, button, [data-track]");
    if (!el) return;
    var label = el.getAttribute("data-track") || el.getAttribute("aria-label") ||
                (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    var href = el.getAttribute("href") || "";
    var out = /^https?:/.test(href) && href.indexOf(location.host) < 0;
    ev((out ? "out:" : "click:") + (label || href).slice(0, 60));
    if (/teerth\.blog/.test(href) && host !== "teerth.blog") ev("funnel_to_blog");
    if (/teerth\.dev/.test(href) && host !== "teerth.dev") ev("funnel_to_dev");
    if (/resume|\.pdf/i.test(href)) ev("resume_open");
    if (/^mailto:/.test(href)) ev("email_click");
    if (/github\.com\/[^/]+\/[^/]+\/pull\//.test(href)) ev("upstream_pr_open");
    if (/linkedin\.com/.test(href)) ev("linkedin_click");
  }, true);

  /* ---------- activity clock ---------- */
  var last = Date.now(), active = 0;
  ["scroll", "pointerdown", "pointermove", "keydown", "touchstart", "wheel"].forEach(function (t) {
    addEventListener(t, function () { last = Date.now(); }, { passive: true });
  });
  function isActive() { return document.visibilityState === "visible" && Date.now() - last < 30000; }

  /* ---------- per-section attention (dynamic heatmap) ---------- */
  var secs = [].slice.call(document.querySelectorAll(
    "section[id], article[id], [id^='pr-'], [id^='p-'], main h2[id], main h3[id], article h2[id]"));
  var visible = {}, dwell = {}, words = {};
  secs.forEach(function (s) { words[s.id] = (s.innerText || "").split(/\s+/).length; });
  if ("IntersectionObserver" in window && secs.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible[e.target.id] = e.isIntersecting && e.intersectionRatio >= 0.35; });
    }, { threshold: [0, 0.35, 0.7] });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------- reading pattern ---------- */
  var lastY = scrollY, lastT = Date.now(), maxScroll = 0, backScrolls = 0, pauses = 0, idleSince = Date.now();
  var speeds = [], copied = 0, selected = 0, marks = {};
  addEventListener("scroll", function () {
    var now = Date.now(), y = scrollY, dy = y - lastY, dt = (now - lastT) / 1000;
    if (now - idleSince > 2500 && y > 200) pauses++;          // stopped to read, then moved on
    if (dy < -250) backScrolls++;                             // went back up to re-read
    if (dt > 0 && dt < 2) speeds.push(Math.abs(dy) / dt);
    lastY = y; lastT = now; idleSince = now;
    var h = document.documentElement;
    var pct = Math.min(100, Math.round((y + innerHeight) / h.scrollHeight * 100));
    if (pct > maxScroll) maxScroll = pct;
    [25, 50, 75, 100].forEach(function (m) { if (pct >= m && !marks[m]) { marks[m] = 1; ev("scroll_" + m); } });
  }, { passive: true });
  document.addEventListener("copy", function () { copied++; ev("text_copied"); });
  document.addEventListener("selectionchange", function () {
    var s = String(getSelection ? getSelection() : "");
    if (s.length > 40 && !selected) { selected = 1; ev("text_selected"); }
  });

  var totalWords = (document.body.innerText || "").split(/\s+/).length;
  function classify() {
    var mins = active / 60;
    var wpm = mins > 0 ? Math.round(totalWords * (maxScroll / 100) / mins) : 0;
    speeds.sort(function (a, b) { return a - b; });
    var med = speeds.length ? speeds[Math.floor(speeds.length / 2)] : 0;
    var spread = speeds.length > 5 ? speeds[Math.floor(speeds.length * 0.9)] / Math.max(1, speeds[Math.floor(speeds.length * 0.1)]) : 0;
    var p = "glancer";
    if (active >= 20) p = wpm > 700 || pauses < 2 ? "skimmer" : "reader";
    if (active >= 90 && (backScrolls >= 2 || copied || selected) && wpm < 450) p = "studier";
    // machine-like: long, perfectly even scrolling with no pauses or pointer use
    if (kind === "human" && speeds.length > 20 && spread < 1.5 && pauses === 0) p = "machine_like";
    return { p: p, wpm: wpm, med: Math.round(med) };
  }

  var seen = {}, reported = "";
  setInterval(function () {
    if (!isActive()) return;
    active += 5;
    Object.keys(visible).forEach(function (k) {
      if (!visible[k]) return;
      dwell[k] = (dwell[k] || 0) + 5;
      [10, 30, 60].forEach(function (s) {
        if (dwell[k] === s) ev("sec:" + k.slice(0, 40) + ":" + s + "s");
      });
    });
    [15, 30, 60, 180, 300, 600].forEach(function (s) {
      if (active >= s && !seen[s]) { seen[s] = 1; ev("active_" + s + "s"); }
    });
    if (!seen.reader && active >= 60 && maxScroll >= 75) { seen.reader = 1; ev("serious_reader"); tag("reader", "serious"); }
    if (active % 15 === 0) {
      var c = classify();
      if (c.p !== reported) { reported = c.p; tag("read_pattern", c.p); ev("pattern_" + c.p); }
      tag("read_wpm", c.wpm);
      var top = Object.keys(dwell).sort(function (a, b) { return dwell[b] - dwell[a]; }).slice(0, 3);
      if (top.length) tag("top_sections", top.join(","));
    }
  }, 5000);
})();
