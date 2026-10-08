/* Pixel room: drag a cartridge into the console (or tap / Enter) to play a project.
   The TV has a face that watches the cursor, reacts to drags and boots the game. */
(function () {
  "use strict";

  var room = document.getElementById("room");
  if (!room) return;

  var PX = window.PX;
  var consoleEl = document.getElementById("console");
  var slot = document.getElementById("slot");
  var tvScreen = document.getElementById("tvScreen");
  var faceEl = document.getElementById("tvFace");
  var noise = document.getElementById("tvNoise");
  var tvImg = document.getElementById("tvImg");
  var tvTitle = document.getElementById("tvTitle");
  var tvLoadText = document.getElementById("tvLoadText");
  var tbText = document.getElementById("tbText");
  var tbHint = document.getElementById("tbHint");
  var statusEl = document.getElementById("roomStatus");
  var dialog = document.getElementById("projectDialog");
  var dlgBody = document.getElementById("dlgBody");
  var dlgCh = document.getElementById("dlgCh");
  var data = document.getElementById("projectData");
  var shelf = document.getElementById("shelf");
  var carts = [].slice.call(room.querySelectorAll(".cart"));

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarse = window.matchMedia("(hover: none)").matches;
  function reduced() { return mqReduce.matches; }
  function t(ms) { return reduced() ? 0 : ms; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, t(ms)); }); }
  function fx(name) { var a = [].slice.call(arguments, 1); if (window.FX && window.FX[name]) window.FX[name].apply(window.FX, a); }

  /* ------------------------------------------------------------------ */
  /* Sprites                                                             */
  /* ------------------------------------------------------------------ */
  var CAT_PAL = { K: "#f0a04b", S: "#c8742a", e: "#23244a", o: "#2fa882", p: "#e0527a", W: "#fff6e8", T: "#f0a04b" };
  var SPRITES = {
    sun: [[
      "...Y.Y...",
      "Y..YYY..Y",
      "..YOOOY..",
      ".YOOOOOY.",
      "YYOOOOOYY",
      ".YOOOOOY.",
      "..YOOOY..",
      "Y..YYY..Y",
      "...Y.Y..."
    ], { Y: "#ffc857", O: "#ffe08a" }],
    moon: [[
      "..MMM...",
      ".MMM....",
      "MMM.....",
      "MMM.....",
      "MMM.....",
      "MMMM....",
      ".MMMMMM.",
      "..MMMM.."
    ], { M: "#fff3c4" }],
    plant: [[
      "....GG..G...",
      "..G.GGG.GG..",
      ".GGG.GLGG...",
      "GGLGG.GG.GG.",
      ".GGLGGGGGLG.",
      "..GGGLGGLG..",
      ".GG.GGGGGGG.",
      "GGGG.GLG.GGG",
      ".GG..GGG..G.",
      "......G.....",
      ".PPPPPPPPPP.",
      "..pppppppp..",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "...PPPPPP...",
      "....PPPP...."
    ], { G: "#2fa882", L: "#7be3bd", P: "#e8745f", p: "#c95b47" }],
    lamp: [[
      ".SSSS.",
      "SSSSSS",
      "SsSSSS",
      "..PP..",
      "..PP..",
      "..PP..",
      "..PP..",
      "..PP..",
      "..PP..",
      "..PP..",
      ".BBBB.",
      "BBBBBB"
    ], { S: "#e0527a", s: "#ff9ab3", P: "#23244a", B: "#23244a" }],
    trophy: [[
      "G.GGGG.G",
      "GGGwGGGG",
      "G.GwGG.G",
      "..GGGG..",
      "...GG...",
      "...GG...",
      "..DDDD..",
      ".DDDDDD.",
      ".DDDDDD."
    ], { G: "#ffc857", w: "#fff8d6", D: "#8a5a36" }],
    cat1: [[
      "K...K.............",
      "KK.KK.............",
      "KKKKKKKSKKKSKKK..T",
      "KeKKeKKSKKKSKKKK.T",
      "KKKKKKKKKKKKKKKKKT",
      "KpKKKKKKKKKKKKKKK.",
      ".KKKKKKKKKKKKKKKK.",
      "..WW........WW....",
      ".................."
    ], CAT_PAL],
    cat2: [[
      "K...K.............",
      "KK.KK.............",
      "KKKKKKKSKKKSKKK...",
      "KeKKeKKSKKKSKKKK..",
      "KKKKKKKKKKKKKKKKK.",
      "KpKKKKKKKKKKKKKKKT",
      ".KKKKKKKKKKKKKKKKT",
      "..WW........WW..T.",
      ".................."
    ], CAT_PAL],
    catAwake: [[
      "K...K............T",
      "KK.KK............T",
      "KKKKKKKSKKKSKKK..T",
      "KoKKoKKSKKKSKKKK.T",
      "KKKKKKKKKKKKKKKKKT",
      "KpKKKKKKKKKKKKKKK.",
      ".KKKKKKKKKKKKKKKK.",
      "..WW........WW....",
      ".................."
    ], CAT_PAL]
  };

  if (PX) {
    [].slice.call(room.querySelectorAll("[data-sprite]")).forEach(function (el) {
      var name = el.getAttribute("data-sprite");
      if (name === "cloud") { el.innerHTML = PX.svg("cloud"); return; }
      var sp = SPRITES[name];
      if (sp) el.insertAdjacentHTML("afterbegin", PX.sprite(sp[0], sp[1]));
    });
  }

  /* ------------------------------------------------------------------ */
  /* TV face                                                             */
  /* ------------------------------------------------------------------ */
  var C = "#7dffb2";
  var face = { mood: "idle", dx: 0, dy: 0, blink: false };

  function r(x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (c || C) + '"/>'; }

  function drawFace() {
    var m = face.mood, dx = face.dx, dy = face.dy, s = "";
    var eyes = [[9, 6], [20, 6]];
    if (m === "happy") {
      eyes.forEach(function (e) { s += r(e[0], e[1] + 3, 1, 1) + r(e[0] + 1, e[1] + 2, 1, 1) + r(e[0] + 2, e[1] + 3, 1, 1); });
      s += r(6, 12, 2, 1, "#ff7b9a") + r(24, 12, 2, 1, "#ff7b9a");
      s += r(11, 13, 1, 1) + r(12, 14, 1, 1) + r(13, 15, 6, 1) + r(19, 14, 1, 1) + r(20, 13, 1, 1);
    } else if (m === "excited") {
      eyes.forEach(function (e) { s += r(e[0] - 1 + dx, e[1] - 1 + dy, 4, 5) + r(e[0] + dx, e[1] + dy, 1, 1, "#0b0c22"); });
      s += r(14, 13, 4, 1) + r(13, 14, 1, 2) + r(18, 14, 1, 2) + r(14, 16, 4, 1);
    } else if (m === "sad") {
      eyes.forEach(function (e) { s += r(e[0], e[1] + 2, 3, 2); });
      s += r(12, 16, 1, 1) + r(13, 15, 6, 1) + r(19, 16, 1, 1);
      s += r(23, 9, 1, 2, "#6ec6ff");
    } else {
      eyes.forEach(function (e) {
        s += face.blink ? r(e[0] + dx, e[1] + 3 + dy, 3, 1) : r(e[0] + dx, e[1] + dy, 3, 4);
      });
      s += r(12, 14, 1, 1) + r(13, 15, 6, 1) + r(19, 14, 1, 1);
    }
    faceEl.innerHTML = '<svg viewBox="0 0 32 20" shape-rendering="crispEdges" aria-hidden="true">' + s + "</svg>";
  }
  function setMood(m) { if (face.mood !== m) { face.mood = m; drawFace(); } }
  drawFace();

  /* Eyes follow the pointer */
  var lookQueued = false, lastPt = null;
  document.addEventListener("pointermove", function (e) {
    if (reduced()) return;
    lastPt = { x: e.clientX, y: e.clientY };
    if (lookQueued) return;
    lookQueued = true;
    requestAnimationFrame(function () {
      lookQueued = false;
      var rc = tvScreen.getBoundingClientRect();
      if (!rc.width) return;
      var vx = lastPt.x - (rc.left + rc.width / 2);
      var vy = lastPt.y - (rc.top + rc.height / 2);
      var ndx = Math.abs(vx) < rc.width * 0.6 ? 0 : (vx > 0 ? 1 : -1);
      var ndy = Math.abs(vy) < rc.height * 0.6 ? 0 : (vy > 0 ? 1 : -1);
      if (ndx !== face.dx || ndy !== face.dy) { face.dx = ndx; face.dy = ndy; drawFace(); }
    });
  }, { passive: true });

  (function blinkLoop() {
    setTimeout(function () {
      if (!reduced() && face.mood === "idle") {
        face.blink = true; drawFace();
        setTimeout(function () { face.blink = false; drawFace(); }, 140);
      }
      blinkLoop();
    }, 2400 + Math.random() * 2800);
  })();

  /* ------------------------------------------------------------------ */
  /* Clock + time of day                                                 */
  /* ------------------------------------------------------------------ */
  var hH = room.querySelector(".hand-h"), hM = room.querySelector(".hand-m");
  function tick() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    if (hH) hH.style.setProperty("--deg", ((h % 12) * 30 + m * 0.5) + "deg");
    if (hM) hM.style.setProperty("--deg", (m * 6) + "deg");
    room.setAttribute("data-time", h >= 7 && h < 17 ? "day" : (h >= 17 && h < 20) || (h >= 5 && h < 7) ? "dusk" : "night");
  }
  tick();
  setInterval(tick, 30000);

  /* ------------------------------------------------------------------ */
  /* Text box                                                            */
  /* ------------------------------------------------------------------ */
  if (coarse && tbHint) tbHint.textContent = "Tap a cartridge to play it, or drag it onto the console.";
  var typing = null;
  function say(html, plain) {
    if (typing) clearInterval(typing);
    if (reduced()) { tbText.innerHTML = html; return; }
    var text = plain || html.replace(/<[^>]+>/g, "");
    var i = 0;
    tbText.textContent = "";
    typing = setInterval(function () {
      i += 2;
      if (i >= text.length) { clearInterval(typing); typing = null; tbText.innerHTML = html; return; }
      tbText.textContent = text.slice(0, i);
    }, 16);
  }
  function announce(msg) { statusEl.textContent = msg; }
  function info(cart) {
    return "<b>" + cart.getAttribute("data-short") + "</b> · " + cart.getAttribute("data-year") + " · " + cart.getAttribute("data-blurb");
  }

  /* ------------------------------------------------------------------ */
  /* Cartridge mechanics                                                 */
  /* ------------------------------------------------------------------ */
  var state = "idle";
  var busy = false;
  var active = null;
  var selected = carts[0];

  function setState(s) { state = s; room.setAttribute("data-state", s); }

  function cellOf(cart) { return cart.parentNode; }
  function homeRect(cart) { return cellOf(cart).getBoundingClientRect(); }
  function cur(cart) { return cart._pos || { x: 0, y: 0, s: 1, r: 0 }; }
  function tf(p) { return "translate(" + p.x + "px," + p.y + "px) scale(" + p.s + ") rotate(" + (p.r || 0) + "deg)"; }
  function place(cart, p) { cart._pos = p; cart.style.transform = tf(p); }

  function animateTo(cart, frames, ms, easing) {
    var from = cur(cart);
    var kf = [{ transform: tf(from) }].concat(frames.map(function (p) { return { transform: tf(p) }; }));
    var last = frames[frames.length - 1];
    if (!ms || reduced() || !cart.animate) { place(cart, last); return Promise.resolve(); }
    var a = cart.animate(kf, { duration: ms, easing: easing || "cubic-bezier(.3,.7,.4,1)", fill: "forwards" });
    return new Promise(function (res) {
      a.onfinish = function () { place(cart, last); a.cancel(); res(); };
    });
  }

  /* Geometry of the slot relative to the cart's home position */
  function slotTargets(cart) {
    var home = homeRect(cart);
    var sr = slot.getBoundingClientRect();
    var s = (sr.width * 0.94) / home.width;
    var h = home.height * s;
    var hx = home.left + home.width / 2, hy = home.top + home.height / 2;
    var x = sr.left + sr.width / 2 - hx;
    var above = sr.top - h / 2 - h * 0.18 - hy;
    var inside = sr.top + sr.height / 2 - h / 2 + h * 0.42 - hy;
    return { x: x, above: above, inside: inside, s: s };
  }

  function hotRect() {
    var a = consoleEl.getBoundingClientRect(), b = tvScreen.getBoundingClientRect();
    var pad = 30;
    return {
      left: Math.min(a.left, b.left) - pad, right: Math.max(a.right, b.right) + pad,
      top: Math.min(a.top, b.top) - pad, bottom: Math.max(a.bottom, b.bottom) + pad
    };
  }
  function isHot(cart) {
    var c = cart.getBoundingClientRect(), r = hotRect();
    var cx = c.left + c.width / 2, cy = c.top + c.height / 2;
    return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
  }

  function lock(on, except) {
    carts.forEach(function (c) {
      if (c === except) return;
      if (on) c.setAttribute("aria-disabled", "true"); else c.removeAttribute("aria-disabled");
    });
  }

  function titleOf(cart) {
    var art = data.querySelector('[data-project="' + cart.getAttribute("data-project") + '"]');
    return art ? art.getAttribute("data-title") : cart.getAttribute("data-short");
  }

  /* --- Noise --- */
  var noiseRaf = null;
  function startNoise() {
    var ctx = noise.getContext("2d");
    var img = ctx.createImageData(noise.width, noise.height);
    room.classList.add("noise");
    (function frame() {
      for (var i = 0; i < img.data.length; i += 4) {
        var v = Math.random() * 255 | 0;
        img.data[i] = v * 0.7; img.data[i + 1] = v; img.data[i + 2] = v * 0.85; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      noiseRaf = requestAnimationFrame(frame);
    })();
  }
  function stopNoise() { cancelAnimationFrame(noiseRaf); room.classList.remove("noise"); }

  /* --- Insert --- */
  function insert(cart) {
    if (busy) return;
    busy = true;
    active = cart;
    lock(true, cart);
    cart.classList.remove("selected", "dragging");
    cart.classList.add("flying");
    cellOf(cart).classList.add("empty");
    setMood("happy");
    say(info(cart));
    announce(titleOf(cart) + " inserted. Loading.");

    var g = slotTargets(cart);
    var from = cur(cart);
    var mid = { x: (from.x + g.x) / 2, y: Math.min(from.y, g.above) - 60, s: (from.s + g.s) / 2, r: -8 };

    animateTo(cart, [mid, { x: g.x, y: g.above, s: g.s, r: 0 }], 560, "cubic-bezier(.3,.6,.4,1)")
      .then(function () {
        cart.classList.remove("flying");
        cart.classList.add("inserted");
        return animateTo(cart, [{ x: g.x, y: g.inside, s: g.s, r: 0 }], 200, "cubic-bezier(.6,0,.9,.5)");
      })
      .then(function () {
        fx("bump", consoleEl);
        fx("sound", "insert");
        var sr = slot.getBoundingClientRect();
        fx("burst", sr.left + sr.width / 2, sr.top, 16, ["#ffc857", "#7dffb2", "#ffffff", "#6ec6ff"]);
        setState("loading");
        tvLoadText.textContent = "LOADING " + cart.getAttribute("data-short");
        if (!reduced()) startNoise();
        return sleep(520);
      })
      .then(function () {
        stopNoise();
        fx("sound", "boot");
        room.style.setProperty("--load", t(800) + "ms");
        return sleep(900);
      })
      .then(function () {
        var img = cart.querySelector(".cart-label img");
        tvImg.src = img ? img.getAttribute("src") : "";
        tvTitle.textContent = cart.getAttribute("data-short");
        setState("playing");
        return sleep(450);
      })
      .then(function () { openDialog(cart); });
  }

  function openDialog(cart) {
    var art = data.querySelector('[data-project="' + cart.getAttribute("data-project") + '"]');
    if (!art) { eject(); return; }
    dlgBody.innerHTML = "";
    var clone = art.cloneNode(true);
    clone.removeAttribute("data-project");
    var h = clone.querySelector("h3");
    if (h) h.id = "dlgTitle";
    dlgBody.appendChild(clone);
    if (PX) PX.render(dlgBody);
    dlgCh.textContent = "CH " + String(carts.indexOf(cart) + 1).padStart(2, "0");

    var rc = tvScreen.getBoundingClientRect();
    var dw = Math.min(760, window.innerWidth - 24);
    dialog.style.setProperty("--ox", (rc.left + rc.width / 2 - window.innerWidth / 2) + "px");
    dialog.style.setProperty("--oy", (rc.top + rc.height / 2 - window.innerHeight / 2) + "px");
    dialog.style.setProperty("--os", Math.max(0.15, rc.width / dw).toFixed(3));

    dialog.showModal();
    dialog.querySelector(".dlg-scroll").scrollTop = 0;
    fx("sound", "open");
    announce("Now playing " + titleOf(cart) + ".");
  }

  function eject() {
    var cart = active;
    if (!cart) { busy = false; lock(false); return; }
    room.classList.add("crt-off");
    fx("sound", "eject");
    announce("Cartridge ejected.");
    sleep(320).then(function () {
      room.classList.remove("crt-off");
      setState("idle");
      setMood("sad");
      var g = slotTargets(cart);
      return animateTo(cart, [{ x: g.x, y: g.above - 10, s: g.s, r: 0 }], 260, "cubic-bezier(.2,.9,.3,1.3)");
    }).then(function () {
      cart.classList.remove("inserted");
      cart.classList.add("flying");
      var p = cur(cart);
      var mid = { x: p.x / 2, y: Math.min(p.y, 0) - 70, s: (p.s + 1) / 2, r: 10 };
      return animateTo(cart, [mid, { x: 0, y: 0, s: 1, r: 0 }], 520, "cubic-bezier(.3,.7,.4,1.1)");
    }).then(function () {
      cart.classList.remove("flying");
      cart.style.transform = "";
      cart._pos = null;
      cellOf(cart).classList.remove("empty");
      lock(false);
      busy = false;
      active = null;
      say("Want another round? <b>Choose a cartridge.</b>");
      try { cart.focus({ preventScroll: true }); } catch (e) { cart.focus(); }
      setTimeout(function () { if (!busy && state === "idle") setMood("idle"); }, t(900));
    });
  }

  dialog.addEventListener("close", function () { if (active) eject(); });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
  });
  dialog.addEventListener("keydown", function (e) {
    if ((e.key === "b" || e.key === "B") && !e.target.closest("input, textarea")) dialog.close();
  });

  /* --- Dragging --- */
  carts.forEach(function (cart) {
    var start = null, pid = null, dragging = false, lastX = 0;

    cart.addEventListener("dragstart", function (e) { e.preventDefault(); });
    cart.addEventListener("contextmenu", function (e) { if (pid !== null) e.preventDefault(); });

    cart.addEventListener("pointerdown", function (e) {
      if (busy || (e.pointerType === "mouse" && e.button !== 0)) return;
      pid = e.pointerId;
      start = { x: e.clientX, y: e.clientY };
      lastX = e.clientX;
      dragging = false;
      try { cart.setPointerCapture(pid); } catch (err) {}
    });

    cart.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pid) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true;
        cart.classList.remove("selected");
        cart.classList.add("dragging");
        cellOf(cart).classList.add("empty");
        fx("sound", "pick");
        setMood("excited");
        say(info(cart));
      }
      if (!dragging) return;
      var vx = e.clientX - lastX;
      lastX = e.clientX;
      var rot = Math.max(-14, Math.min(14, vx * 1.2));
      place(cart, { x: dx, y: dy, s: 1.12, r: rot });
      var hot = isHot(cart);
      setState(hot ? "hot" : "idle");
      setMood(hot ? "happy" : "excited");
    });

    function finish(e, cancelled) {
      if (e.pointerId !== pid) return;
      try { cart.releasePointerCapture(pid); } catch (err) {}
      pid = null;
      if (busy) return;
      if (!dragging) { if (!cancelled) insert(cart); return; }
      dragging = false;
      if (!cancelled && isHot(cart)) { insert(cart); return; }
      cart.classList.remove("dragging");
      cart.classList.add("flying");
      setState("idle");
      setMood("idle");
      fx("sound", "nope");
      animateTo(cart, [{ x: 0, y: 0, s: 1, r: 0 }], 420, "cubic-bezier(.3,1.5,.5,1)").then(function () {
        cart.classList.remove("flying");
        cart.style.transform = "";
        cart._pos = null;
        cellOf(cart).classList.remove("empty");
      });
    }
    cart.addEventListener("pointerup", function (e) { finish(e, false); });
    cart.addEventListener("pointercancel", function (e) { finish(e, true); });

    /* Keyboard activation (Enter / Space fire click with detail 0) */
    cart.addEventListener("click", function (e) { if (e.detail === 0 && !busy) insert(cart); });

    cart.addEventListener("focus", function () { select(cart, true); });
    cart.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && !busy) say(info(cart)); });
  });

  /* --- Roving focus across the shelf --- */
  function select(cart, fromFocus) {
    if (selected === cart && !fromFocus) return;
    carts.forEach(function (c) { c.tabIndex = c === cart ? 0 : -1; c.classList.toggle("selected", c === cart && fromFocus && !busy); });
    selected = cart;
    if (!busy) say(info(cart));
  }
  shelf.addEventListener("keydown", function (e) {
    var i = carts.indexOf(document.activeElement);
    if (i < 0) return;
    var n = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % carts.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + carts.length) % carts.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = carts.length - 1;
    if (n === null) return;
    e.preventDefault();
    carts[n].focus();
    fx("sound", "click");
  });
  shelf.addEventListener("focusout", function (e) {
    if (!shelf.contains(e.relatedTarget)) carts.forEach(function (c) { c.classList.remove("selected"); });
  });

  /* ------------------------------------------------------------------ */
  /* Cat + trophy                                                        */
  /* ------------------------------------------------------------------ */
  var cat = document.getElementById("cat");
  if (cat && PX) {
    var f1 = cat.querySelector(".cat-f1");
    var sleepSvg = f1.innerHTML;
    var awakeTimer = null;
    cat.addEventListener("click", function () {
      var rc = cat.getBoundingClientRect();
      cat.classList.add("awake");
      f1.innerHTML = PX.sprite(SPRITES.catAwake[0], SPRITES.catAwake[1]);
      fx("sound", "meow");
      fx("burst", rc.left + rc.width * 0.3, rc.top, 10, ["#e0527a", "#ff9ab3", "#ffffff"]);
      announce("Meow!");
      clearTimeout(awakeTimer);
      awakeTimer = setTimeout(function () { cat.classList.remove("awake"); f1.innerHTML = sleepSvg; }, 1800);
    });
  }
  var trophy = document.getElementById("trophy");
  if (trophy) {
    trophy.addEventListener("click", function () {
      var rc = trophy.getBoundingClientRect();
      fx("burst", rc.left + rc.width / 2, rc.top + rc.height / 2, 22, ["#ffc857", "#fff3c4", "#ffffff"]);
      fx("sound", "level");
      fx("toast", "1ST PLACE · ÇANKAYA R&D MARKET ★");
    });
  }

  /* Shrink cartridge names until they fit their label */
  function fitNames() {
    var names = [].slice.call(room.querySelectorAll(".cart-name"));
    var min = Infinity;
    names.forEach(function (n) {
      n.style.fontSize = "";
      var fs = parseFloat(getComputedStyle(n).fontSize);
      var guard = 0;
      while (n.scrollWidth > n.clientWidth + 0.5 && guard++ < 24 && fs > 6) {
        fs -= 0.5;
        n.style.fontSize = fs + "px";
      }
      min = Math.min(min, fs);
    });
    /* one shared size so every label looks the same */
    names.forEach(function (n) { n.style.fontSize = min + "px"; });
  }
  fitNames();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
  var fitTimer = null;

  setState("idle");
  window.addEventListener("resize", function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitNames, 150);
    if (active && !busy) return;
    if (active && active.classList.contains("inserted")) {
      var g = slotTargets(active);
      place(active, { x: g.x, y: g.inside, s: g.s, r: 0 });
    }
  });
})();
