/* Tiny pixel-art renderer: turns ASCII grids into crisp inline SVG.
   '1' = currentColor, '2' = var(--px2), '3' = var(--px3), '.' = empty */
(function () {
  "use strict";

  var ICONS = {
    pin: [
      "..1111..",
      ".111111.",
      "11122111",
      "11122111",
      ".111111.",
      "..1111..",
      "...11...",
      "...1...."
    ],
    store: [
      "11111111",
      "13131313",
      "11111111",
      "1......1",
      "1.2222.1",
      "1.2..2.1",
      "1.2..2.1",
      "11111111"
    ],
    heart: [
      ".11..11.",
      "11211111",
      "12111111",
      "11111111",
      ".111111.",
      "..1111..",
      "...11...",
      "........"
    ],
    chip: [
      ".1.11.1.",
      "11111111",
      ".1....1.",
      "11.22.11",
      "11.22.11",
      ".1....1.",
      "11111111",
      ".1.11.1."
    ],
    box: [
      "..1111..",
      ".111111.",
      "11111111",
      "1......1",
      "1.3333.1",
      "1.3..3.1",
      "1.3333.1",
      "11111111"
    ],
    bubble: [
      "11111111",
      "1......1",
      "1.2222.1",
      "1......1",
      "1.2222.1",
      "11111111",
      "..11....",
      "..1....."
    ],
    spade: [
      "...11...",
      "..1111..",
      ".111111.",
      "11111111",
      "11111111",
      ".11.11..",
      "...11...",
      "..1111.."
    ],
    star: [
      "...11...",
      "...11...",
      "11111111",
      ".111111.",
      "..1111..",
      ".111111.",
      ".11..11.",
      "11....11"
    ],
    coin: [
      "..1111..",
      ".122221.",
      "12233221",
      "12322221",
      "12233221",
      "12222321",
      ".122221.",
      "..1111.."
    ],
    gamepad: [
      "..11111111..",
      ".1111111111.",
      "11131111111",
      "13331112121",
      "11131111111",
      ".1111111111.",
      "..11....11.."
    ]
  };

  function svg(name) {
    var grid = ICONS[name];
    if (!grid) return "";
    var h = grid.length;
    var w = 0;
    var rects = "";
    grid.forEach(function (row, y) {
      if (row.length > w) w = row.length;
      for (var x = 0; x < row.length; x++) {
        var c = row.charAt(x);
        if (c === ".") continue;
        var fill =
          c === "1"
            ? 'fill="currentColor"'
            : c === "2"
            ? 'style="fill:var(--px2,#fff)"'
            : 'style="fill:var(--px3,#23244a)"';
        rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" ' + fill + "/>";
      }
    });
    return (
      '<svg viewBox="0 0 ' + w + " " + h +
      '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
      rects + "</svg>"
    );
  }

  function render(root) {
    (root || document).querySelectorAll("[data-px]").forEach(function (el) {
      el.innerHTML = svg(el.getAttribute("data-px"));
    });
  }

  window.PX = { svg: svg, render: render, ICONS: ICONS };
  render(document);
})();
