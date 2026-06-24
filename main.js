/* ============================================================
   Raphaël Rubrice — site scripts
   1. living single-cell embedding (hero signature)
   2. scroll reveals
   3. mobile nav
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- scroll reveals ---------- */
  var reveal = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveal.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     single-cell embedding
     ============================================================ */
  var canvas = document.getElementById("field");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  // green signal ramp — sampled from the CSS palette (GFP / embedding encoding)
  var RAMP = [
    [14, 110, 85],   // deep teal-green
    [31, 184, 119],  // emerald
    [84, 232, 146],  // GFP green
    [184, 247, 106]  // lime
  ];
  function ramp(t) {
    t = Math.max(0, Math.min(1, t));
    var seg = t * (RAMP.length - 1);
    var i = Math.floor(seg), f = seg - i;
    var a = RAMP[i], b = RAMP[Math.min(i + 1, RAMP.length - 1)];
    return [
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f)
    ];
  }

  var W = 0, H = 0, DPR = 1;
  var cells = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var clusters = [];

  // small deterministic gaussian
  function gauss() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function layout() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // five "cell populations", weighted toward the right so the left stays
    // clear for the headline; spread is fluid with viewport size
    var cx = W * 0.66, cy = H * 0.5;
    var spread = Math.min(W, H) * 0.5;
    clusters = [
      { x: cx + spread * 0.10, y: cy - spread * 0.55, s: spread * 0.20, t: 0.05 },
      { x: cx + spread * 0.62, y: cy - spread * 0.12, s: spread * 0.24, t: 0.32 },
      { x: cx + spread * 0.34, y: cy + spread * 0.34, s: spread * 0.26, t: 0.58 },
      { x: cx - spread * 0.18, y: cy + spread * 0.06, s: spread * 0.22, t: 0.80 },
      { x: cx + spread * 0.92, y: cy + spread * 0.50, s: spread * 0.18, t: 1.00 }
    ];

    var count = W < 680 ? 320 : (W < 1040 ? 520 : 760);
    cells = [];
    for (var i = 0; i < count; i++) {
      var c = clusters[i % clusters.length];
      // jitter the latent value within a population for a smooth gradient
      var t = Math.max(0, Math.min(1, c.t + gauss() * 0.06));
      var bx = c.x + gauss() * c.s;
      var by = c.y + gauss() * c.s;
      var col = ramp(t);
      cells.push({
        bx: bx, by: by, x: bx, y: by,
        vx: 0, vy: 0,
        r: 1.1 + Math.random() * 1.9,
        col: col,
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.7
      });
    }
    if (document.getElementById("r-n")) document.getElementById("r-n").textContent = count;
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < cells.length; i++) {
      var p = cells[i];
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + ",0.85)";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  var t0 = performance.now();
  var perturbing = false;
  var rxy = document.getElementById("r-xy");
  var rp = document.getElementById("r-p");

  function frame(now) {
    var time = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    var anyPush = false;

    for (var i = 0; i < cells.length; i++) {
      var p = cells[i];

      // ambient breathing around the base position
      var tx = p.bx + Math.cos(time * p.sp + p.ph) * 2.2;
      var ty = p.by + Math.sin(time * p.sp * 0.9 + p.ph) * 2.2;

      // cursor = perturbation: push cells radially out of the probe radius
      if (pointer.active) {
        var dx = p.x - pointer.x, dy = p.y - pointer.y;
        var d2 = dx * dx + dy * dy;
        var R = 130;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) || 0.001;
          var force = (1 - d / R) * 4.4;
          p.vx += (dx / d) * force;
          p.vy += (dy / d) * force;
          anyPush = true;
        }
      }

      // spring back toward the (breathing) base + damping
      p.vx += (tx - p.x) * 0.012;
      p.vy += (ty - p.y) * 0.012;
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;

      var glow = Math.min(1, (Math.abs(p.vx) + Math.abs(p.vy)) * 0.12);
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + "," + (0.78 + glow * 0.22) + ")";
      ctx.arc(p.x, p.y, p.r + glow * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // readout
    if (anyPush !== perturbing) {
      perturbing = anyPush;
      if (rp) { rp.textContent = perturbing ? "active" : "idle"; }
    }
    if (pointer.active && rxy) {
      rxy.textContent = ((pointer.x / W) * 2 - 1).toFixed(2) + ", " + ((pointer.y / H) * 2 - 1).toFixed(2);
    }

    raf = requestAnimationFrame(frame);
  }

  var raf = null;
  function start() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* pointer (perturbation probe) */
  function setPointer(e) {
    var rect = canvas.getBoundingClientRect();
    var pt = e.touches ? e.touches[0] : e;
    pointer.x = pt.clientX - rect.left;
    pointer.y = pt.clientY - rect.top;
    pointer.active = true;
  }
  canvas.parentElement.addEventListener("pointermove", setPointer);
  canvas.parentElement.addEventListener("pointerleave", function () { pointer.active = false; });
  canvas.parentElement.addEventListener("touchmove", setPointer, { passive: true });

  /* resize (debounced) */
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      layout();
      if (reduce) drawStatic();
    }, 160);
  });

  /* pause when the hero scrolls out / tab hidden — saves battery */
  if ("IntersectionObserver" in window) {
    var vis = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 });
    vis.observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });

  // boot
  layout();
  if (reduce) { drawStatic(); if (rp) rp.textContent = "static"; }
  else { start(); }
})();
