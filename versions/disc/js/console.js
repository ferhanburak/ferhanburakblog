/* Project console: drag a disc into the tray (or tap / press Enter) to open a project. */
(function () {
  "use strict";

  var consoleEl = document.getElementById("console");
  var tray = document.getElementById("tray");
  var screenText = document.getElementById("screenText");
  var screenBar = document.getElementById("screenBar");
  var dialog = document.getElementById("projectDialog");
  var dlgBody = document.getElementById("dlgBody");
  var data = document.getElementById("projectData");
  var discs = [].slice.call(document.querySelectorAll(".disc"));
  if (!consoleEl || !tray || !dialog || !data || !discs.length) return;

  var DRAG_THRESHOLD = 6;
  var HOT_PADDING = 36;
  var busy = false;
  var active = null;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function t(ms) { return reduceMotion.matches ? 0 : ms; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, t(ms)); }); }

  function setState(state) { consoleEl.setAttribute("data-state", state); }
  function setScreen(text) { screenText.textContent = text; }
  function art(disc) { return disc.querySelector(".disc-art"); }
  function fx(name) { var a = [].slice.call(arguments, 1); if (window.FX && window.FX[name]) window.FX[name].apply(window.FX, a); }

  function artCenter(disc) {
    var r = art(disc).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function overTray(disc) {
    var c = artCenter(disc);
    var r = tray.getBoundingClientRect();
    return c.x > r.left - HOT_PADDING && c.x < r.right + HOT_PADDING &&
           c.y > r.top - HOT_PADDING && c.y < r.bottom + HOT_PADDING;
  }

  function setBusyUI(on, except) {
    discs.forEach(function (d) {
      if (d === except) return;
      if (on) d.setAttribute("aria-disabled", "true"); else d.removeAttribute("aria-disabled");
    });
  }

  function titleOf(disc) {
    var article = data.querySelector('[data-project="' + disc.getAttribute("data-project") + '"]');
    return article ? article.getAttribute("data-title") : disc.querySelector(".disc-name").textContent;
  }

  function retract(disc) {
    disc.classList.remove("dragging");
    disc.classList.add("snapping");
    disc.style.transform = "";
    disc._tx = 0; disc._ty = 0;
    setState("idle");
    setScreen("INSERT DISC");
    setTimeout(function () { disc.classList.remove("snapping"); }, t(500));
  }

  /* Slide disc into the tray, boot the screen, then open the dialog. */
  function insert(disc) {
    if (busy) return;
    busy = true;
    active = disc;
    setBusyUI(true, disc);

    var name = titleOf(disc).toUpperCase();
    var tx = disc._tx || 0, ty = disc._ty || 0;
    var from = artCenter(disc);
    var tr = tray.getBoundingClientRect();
    var nx = tx + (tr.left + tr.width / 2 - from.x);
    var ny = ty + (tr.top + tr.height / 2 - from.y);

    disc.classList.remove("dragging");
    disc.classList.add("snapping");
    disc._tx = nx; disc._ty = ny;
    disc.style.transform = "translate(" + nx + "px," + ny + "px) scale(.9)";
    setState("hot");
    setScreen("DISC DETECTED");

    sleep(480)
      .then(function () {
        disc.classList.add("inserted");
        setState("loading");
        setScreen("LOADING " + name);
        consoleEl.style.setProperty("--load", t(900) + "ms");
        fx("bump", consoleEl);
        fx("sound", "insert");
        fx("burst", tr.left + tr.width / 2, tr.top + tr.height / 2, 18, ["#ffc857", "#7dffb2", "#ffffff", "#6ec6ff"]);
        return sleep(300);
      })
      .then(function () {
        fx("sound", "boot");
        return sleep(700);
      })
      .then(function () {
        openDialog(disc);
      });
  }

  function openDialog(disc) {
    var article = data.querySelector('[data-project="' + disc.getAttribute("data-project") + '"]');
    if (!article) { eject(); return; }
    dlgBody.innerHTML = "";
    var clone = article.cloneNode(true);
    clone.removeAttribute("data-project");
    var h = clone.querySelector("h3");
    if (h) h.id = "dlgTitle";
    dlgBody.appendChild(clone);
    if (window.PX) window.PX.render(dlgBody);
    setState("open");
    setScreen("NOW PLAYING: " + titleOf(disc).toUpperCase());
    dialog.showModal();
    fx("sound", "open");
    fx("burst", window.innerWidth / 2, window.innerHeight * 0.3, 24);
    dialog.querySelector(".dlg-inner").scrollTop = 0;
  }

  function eject() {
    var disc = active;
    if (!disc) { busy = false; setBusyUI(false); return; }
    setScreen("EJECTING...");
    setState("idle");
    fx("sound", "eject");
    disc.classList.remove("inserted");
    disc.classList.add("snapping");
    disc.style.transform = "";
    disc._tx = 0; disc._ty = 0;
    sleep(650).then(function () {
      disc.classList.remove("snapping");
      setScreen("INSERT DISC");
      setBusyUI(false);
      busy = false;
      active = null;
      try { disc.focus({ preventScroll: true }); } catch (e) { disc.focus(); }
    });
  }

  dialog.addEventListener("close", eject);
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
  });
  dialog.addEventListener("cancel", function () { /* Esc closes natively, then "close" fires */ });

  /* Pointer-driven dragging */
  discs.forEach(function (disc) {
    var startX = 0, startY = 0, pointerId = null, dragging = false;
    disc._tx = 0; disc._ty = 0;

    disc.addEventListener("dragstart", function (e) { e.preventDefault(); });
    disc.addEventListener("contextmenu", function (e) { if (pointerId !== null) e.preventDefault(); });

    disc.addEventListener("pointerdown", function (e) {
      if (busy || (e.pointerType === "mouse" && e.button !== 0)) return;
      pointerId = e.pointerId;
      discs.forEach(function (d) { d.removeAttribute("data-hint"); });
      startX = e.clientX; startY = e.clientY;
      dragging = false;
      try { disc.setPointerCapture(pointerId); } catch (err) {}
    });

    disc.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pointerId) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragging = true;
        disc.classList.remove("snapping");
        disc.classList.add("dragging");
        fx("sound", "pick");
      }
      if (dragging) {
        disc._tx = dx; disc._ty = dy;
        disc.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.06)";
        var hot = overTray(disc);
        setState(hot ? "hot" : "idle");
        setScreen(hot ? "RELEASE TO INSERT" : "INSERT DISC");
      }
    });

    function finish(e, cancelled) {
      if (e.pointerId !== pointerId) return;
      try { disc.releasePointerCapture(pointerId); } catch (err) {}
      pointerId = null;
      if (busy) return;
      if (!dragging) {
        if (!cancelled) insert(disc); /* tap */
        return;
      }
      dragging = false;
      if (!cancelled && overTray(disc)) insert(disc); else retract(disc);
    }
    disc.addEventListener("pointerup", function (e) { finish(e, false); });
    disc.addEventListener("pointercancel", function (e) { finish(e, true); });

    /* Keyboard: Enter / Space produce a click with detail === 0 */
    disc.addEventListener("click", function (e) {
      discs.forEach(function (d) { d.removeAttribute("data-hint"); });
      if (e.detail === 0 && !busy) insert(disc);
    });
  });
})();
