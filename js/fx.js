/* Playful effects: sky, letter bounce, typewriter, counters, XP bar, tilt,
   confetti, cursor sparkles, chiptune blips, Konami code. Exposes window.FX. */
(function () {
  "use strict";

  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() { return mq.matches; }
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var COLORS = ["#5b5bd6", "#ffc857", "#e0527a", "#2fa882", "#6ec6ff", "#ffffff"];
  var live = 0;
  var FX = (window.FX = {});

  /* ---------- Confetti / pixel burst ---------- */
  FX.burst = function (x, y, n, colors) {
    if (reduced()) return;
    n = n || 16;
    colors = colors || COLORS;
    for (var i = 0; i < n; i++) {
      if (live > 160) return;
      live++;
      var s = document.createElement("i");
      var size = 5 + Math.floor(Math.random() * 3) * 2;
      s.className = "fx-px";
      s.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + size + "px;height:" + size +
        "px;background:" + colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(s);
      var ang = Math.random() * Math.PI * 2;
      var v = 50 + Math.random() * 130;
      var dx = Math.cos(ang) * v;
      var up = -(30 + Math.random() * 110);
      var down = 40 + Math.random() * 120;
      var rot = (Math.random() - 0.5) * 540;
      var a = s.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + dx * 0.6 + "px," + up + "px) rotate(" + rot / 2 + "deg)", opacity: 1, offset: 0.42 },
        { transform: "translate(" + dx + "px," + down + "px) rotate(" + rot + "deg)", opacity: 0 }
      ], { duration: 800 + Math.random() * 500, easing: "cubic-bezier(.3,.6,.5,1)" });
      a.onfinish = (function (el) { return function () { el.remove(); live--; }; })(s);
    }
  };

  FX.bump = function (el) {
    if (reduced() || !el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
    setTimeout(function () { el.classList.remove("bump"); }, 460);
  };

  FX.toast = function (text) {
    var old = document.querySelector(".fx-toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "fx-toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2900);
  };

  /* ---------- Chiptune blips (off by default) ---------- */
  var audioCtx = null;
  var soundOn = false;
  try { soundOn = localStorage.getItem("fx-sound") === "1"; } catch (e) {}

  function audio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, start, dur) {
    var c = audio();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    var t0 = c.currentTime + start;
    o.type = "square";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.04, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  var SOUNDS = {
    pick: [[880, 0, 0.06]],
    insert: [[523, 0, 0.08], [659, 0.08, 0.08], [784, 0.16, 0.12]],
    boot: [[262, 0, 0.1], [330, 0.12, 0.1], [392, 0.24, 0.1], [523, 0.36, 0.2]],
    open: [[784, 0, 0.08], [1046, 0.09, 0.2]],
    eject: [[784, 0, 0.08], [523, 0.09, 0.14]],
    click: [[660, 0, 0.05]],
    level: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1046, 0.3, 0.25]],
    meow: [[740, 0, 0.07], [880, 0.07, 0.06], [587, 0.14, 0.2]],
    nope: [[220, 0, 0.12], [196, 0.13, 0.16]]
  };
  FX.sound = function (name) {
    if (!soundOn) return;
    (SOUNDS[name] || []).forEach(function (n) { tone(n[0], n[1], n[2]); });
  };

  var sndBtn = document.getElementById("sndBtn");
  function paintSnd() {
    if (!sndBtn) return;
    sndBtn.setAttribute("aria-pressed", String(soundOn));
    sndBtn.setAttribute("aria-label", "Sound effects: " + (soundOn ? "on" : "off"));
    var b = sndBtn.querySelector("b");
    if (b) b.textContent = soundOn ? "ON" : "OFF";
  }
  if (sndBtn) {
    paintSnd();
    sndBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      try { localStorage.setItem("fx-sound", soundOn ? "1" : "0"); } catch (e) {}
      paintSnd();
      if (soundOn) FX.sound("insert");
    });
  }

  /* ---------- Hero: letter bounce, typewriter, sky ---------- */
  var h1 = document.querySelector(".hero h1");
  if (h1 && !reduced()) {
    h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
    var idx = 0;
    (function split(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split("").forEach(function (ch) {
            if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span");
            s.className = "ch";
            s.setAttribute("aria-hidden", "true");
            s.style.setProperty("--i", idx++);
            s.textContent = ch;
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          split(n);
        }
      });
    })(h1);
  }

  var typeEl = document.querySelector(".type");
  if (typeEl && !reduced()) {
    var words = typeEl.getAttribute("data-words").split("|");
    var w = 0, c = 0, deleting = false;
    (function tick() {
      var word = words[w];
      typeEl.textContent = word.slice(0, c);
      var delay = deleting ? 35 : 75;
      if (!deleting && c === word.length) { deleting = true; delay = 1500; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      else { c += deleting ? -1 : 1; }
      setTimeout(tick, delay);
    })();
  }

  var hero = document.querySelector(".hero");
  if (hero && window.PX && !reduced()) {
    var sky = document.createElement("div");
    sky.className = "sky";
    sky.setAttribute("aria-hidden", "true");
    var stars = [[6, 12, 14], [14, 64, 10], [24, 30, 12], [38, 8, 10], [52, 78, 14], [63, 18, 12], [72, 55, 10], [84, 10, 14], [92, 70, 12], [47, 90, 10], [30, 88, 12], [78, 36, 10]];
    stars.forEach(function (s, i) {
      var el = document.createElement("span");
      el.className = "star";
      el.setAttribute("data-px", "star");
      el.style.cssText = "left:" + s[0] + "%;top:" + s[1] + "%;width:" + s[2] + "px;height:" + s[2] + "px;animation-delay:-" + (i * 0.37).toFixed(2) + "s;--px2:#fff";
      sky.appendChild(el);
    });
    [[8, 78, 60], [55, 52, 44], [24, 34, 80]].forEach(function (cl, i) {
      var el = document.createElement("span");
      el.className = "cloud";
      el.setAttribute("data-px", "cloud");
      el.style.cssText = "top:" + cl[0] + "%;width:" + (cl[2] + 40) + "px;height:" + (cl[2] + 40) * 5 / 12 + "px;animation-duration:" + (cl[1] + i * 10) + "s;animation-delay:-" + (i * 17) + "s";
      sky.appendChild(el);
    });
    hero.insertBefore(sky, hero.firstChild);
    window.PX.render(sky);
  }

  /* ---------- Reveal choreography (classes picked up by main.js) ---------- */
  function mark(sel, fn) {
    [].slice.call(document.querySelectorAll(sel)).forEach(fn);
  }
  mark(".timeline > li", function (el, i) { el.classList.add("reveal"); el.setAttribute("data-fx", i % 2 ? "right" : "left"); });
  mark(".award-grid > li", function (el, i) {
    el.classList.add("reveal", "tilt");
    el.setAttribute("data-fx", "pop");
    el.style.setProperty("--d", (i * 90) + "ms");
  });
  mark(".edu-row .card", function (el, i) { el.setAttribute("data-fx", i ? "right" : "left"); });
  mark(".about-grid > .card", function (el, i) { el.setAttribute("data-fx", i ? "right" : "left"); });
  mark(".contact-grid > .card", function (el, i) { el.setAttribute("data-fx", i ? "right" : "left"); });
  mark(".hero-visual", function (el) { el.setAttribute("data-fx", "pop"); });
  mark(".stat-row li", function (el, i) { el.style.setProperty("--i", i); });
  mark(".skills .chips li", function (el, i) { el.style.setProperty("--i", i); });
  mark(".shelf .cart", function (el, i) { el.style.setProperty("--i", i); });

  /* ---------- Counters ---------- */
  var counters = [].slice.call(document.querySelectorAll("[data-count]"));
  function runCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduced()) { el.textContent = target + suffix; return; }
    var t0 = performance.now();
    var dur = 1100;
    (function frame(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }
  if ("IntersectionObserver" in window && counters.length && !reduced()) {
    counters.forEach(function (el) { el.textContent = "0" + (el.getAttribute("data-suffix") || ""); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- XP scroll bar ---------- */
  var xp = document.querySelector(".xp");
  var leveled = false;
  var ticking = false;
  function updateXp() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (xp) xp.style.setProperty("--p", p.toFixed(4));
    if (p > 0.995 && !leveled) {
      leveled = true;
      if (xp) xp.classList.add("full");
      FX.toast("LEVEL UP!  Thanks for playing ★");
      FX.sound("level");
      FX.burst(window.innerWidth / 2, window.innerHeight - 60, 28);
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateXp); }
  }, { passive: true });
  updateXp();

  /* ---------- 3D tilt (mouse / pen only) ---------- */
  function tilt(el, max) {
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" || reduced()) return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", (-py * max).toFixed(2) + "deg");
      el.style.setProperty("--ry", (px * max * 1.2).toFixed(2) + "deg");
    });
    el.addEventListener("pointerleave", function () {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  }
  if (finePointer) {
    var portrait = document.querySelector(".portrait");
    if (portrait) { portrait.classList.add("tilt"); tilt(portrait, 14); }
    mark(".award-grid > li", function (el) { tilt(el, 10); });
  }

  /* ---------- Click bursts on buttons ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".clay-btn");
    if (!btn) return;
    var x = e.clientX, y = e.clientY;
    if (!x && !y) {
      var r = btn.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    FX.burst(x, y, 12);
    FX.sound("click");
  });

  /* ---------- Cursor sparkle trail (mouse only, subtle) ---------- */
  if (finePointer) {
    var last = 0;
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || reduced()) return;
      var now = performance.now();
      if (now - last < 55) return;
      if (e.target.closest && e.target.closest("input, textarea, dialog")) return;
      last = now;
      if (live > 120) return;
      live++;
      var s = document.createElement("i");
      var size = 4 + Math.floor(Math.random() * 2) * 2;
      s.className = "fx-px";
      s.style.cssText = "left:" + (e.clientX + (Math.random() * 10 - 5)) + "px;top:" + (e.clientY + (Math.random() * 10 - 5)) + "px;width:" + size + "px;height:" + size + "px;background:" + COLORS[Math.floor(Math.random() * 5)];
      document.body.appendChild(s);
      var a = s.animate([
        { transform: "translateY(0) scale(1)", opacity: 0.9 },
        { transform: "translateY(" + (14 + Math.random() * 14) + "px) scale(.3)", opacity: 0 }
      ], { duration: 520, easing: "ease-out" });
      a.onfinish = function () { s.remove(); live--; };
    }, { passive: true });
  }

  /* ---------- Hero card flip: photo <-> pixel art ---------- */
  var flip = document.getElementById("flip");
  var flipTag = document.getElementById("flipTag");
  if (flip) {
    flip.addEventListener("click", function (e) {
      var on = flip.getAttribute("aria-pressed") !== "true";
      flip.setAttribute("aria-pressed", String(on));
      flip.setAttribute("aria-label", on ? "Flip the card back to my photo" : "Flip the card to see my pixel-art version");
      if (flipTag) flipTag.textContent = on ? "PHOTO MODE" : "8-BIT MODE";
      var r = flip.getBoundingClientRect();
      FX.burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 16);
      FX.sound(on ? "insert" : "eject");
    });
    /* one gentle peek after load so people notice it can flip */
    if (!reduced()) setTimeout(function () {
      flip.classList.add("peek");
      setTimeout(function () { flip.classList.remove("peek"); }, 1500);
    }, 2600);
  }

  /* ---------- Konami code ---------- */
  var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var pos = 0;
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    pos = k === KONAMI[pos] ? pos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (pos === KONAMI.length) {
      pos = 0;
      FX.toast("+30 LIVES  ·  CHEAT ACTIVATED");
      FX.sound("level");
      var rounds = 0;
      var iv = setInterval(function () {
        FX.burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5, 20);
        if (++rounds > 10) clearInterval(iv);
      }, 220);
    }
  });
})();
