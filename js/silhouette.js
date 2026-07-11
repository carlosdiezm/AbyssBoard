/*
 * Builds an SVG comparing a surfer's body silhouette (front view) against
 * the recommended board's plan-shape outline (top view), drawn to a shared
 * scale in centimetres so lengths and widths are directly comparable.
 */
(function (global) {
  "use strict";

  var I18N = global.I18N || (typeof require !== "undefined" ? require("./i18n.js") : null);

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ---- Person silhouette: traced from /shapes/person.svg (a rounded human icon) ----
  function bodyWidthFactor(heightCm, weightKg) {
    var bmi = weightKg / Math.pow(heightCm / 100, 2);
    return clamp(1 + (bmi - 23) * 0.014, 0.85, 1.18);
  }

  // Reference art's own viewBox (0 0 357 822) - the path's raw coordinates are
  // mapped into this box by PERSON_RAW_TRANSFORM (the combination of the two
  // nested matrix transforms in the original SVG file, collapsed into one).
  var PERSON_VIEW_W = 357;
  var PERSON_VIEW_H = 822;
  var PERSON_RAW_TRANSFORM = "matrix(0.715583,0,0,0.715583,-880.267908,-1920.807197)";
  var PERSON_PATH_D =
    "M1479.581,2684.254C1536.548,2684.254 1582.799,2730.505 1582.799,2787.472C1582.799,2844.44 1536.548,2890.69 1479.581,2890.69C1422.613,2890.69 1376.362,2844.44 1376.362,2787.472C1376.362,2730.505 1422.613,2684.254 1479.581,2684.254ZM1282.739,3384.538C1253.69,3384.538 1230.141,3360.99 1230.141,3331.941L1230.141,2990.539C1230.141,2956.387 1257.826,2928.702 1291.977,2928.702L1667.184,2928.702C1701.335,2928.702 1729.021,2956.387 1729.021,2990.539L1729.021,3331.941C1729.021,3360.99 1705.471,3384.538 1676.422,3384.538C1662.473,3384.538 1649.093,3378.997 1639.23,3369.133C1629.366,3359.269 1623.824,3345.891 1623.824,3331.941L1623.824,3050C1623.824,3041.108 1616.615,3033.899 1607.722,3033.899C1598.83,3033.899 1591.621,3041.108 1591.621,3050L1591.621,3780.129C1591.621,3794.079 1586.079,3807.458 1576.215,3817.321C1566.351,3827.185 1552.972,3832.727 1539.022,3832.727C1509.974,3832.727 1486.424,3809.178 1486.424,3780.129L1486.424,3391.38C1486.424,3389.566 1485.703,3387.825 1484.42,3386.542C1483.137,3385.259 1481.397,3384.538 1479.582,3384.538L1479.579,3384.538C1477.764,3384.538 1476.024,3385.259 1474.741,3386.542C1473.458,3387.825 1472.737,3389.566 1472.737,3391.38L1472.737,3780.129C1472.737,3809.178 1449.188,3832.727 1420.139,3832.727C1406.189,3832.727 1392.81,3827.185 1382.946,3817.321C1373.082,3807.458 1367.54,3794.079 1367.54,3780.129L1367.54,3050C1367.54,3041.108 1360.331,3033.899 1351.439,3033.899C1342.546,3033.899 1335.337,3041.108 1335.337,3050L1335.337,3331.941C1335.337,3345.891 1329.796,3359.269 1319.932,3369.133C1310.068,3378.997 1296.689,3384.538 1282.739,3384.538Z";

  function pointsToD(points) {
    var d = "";
    for (var i = 0; i < points.length; i++) {
      d += (i === 0 ? "M " : "L ") + points[i][0].toFixed(2) + " " + points[i][1].toFixed(2) + " ";
    }
    return d + "Z";
  }

  // Returns SVG element markup (string) for the person, in cm-space, centred on x=0,
  // feet resting on y=heightCm (i.e. head near y=0). Scales the reference figure's
  // own [0,357]x[0,822] box to that, widening it slightly for higher-BMI builds.
  function buildPersonSvg(heightCm, weightKg) {
    var wf = bodyWidthFactor(heightCm, weightKg);
    var scaleY = heightCm / PERSON_VIEW_H;
    var scaleX = scaleY * wf;
    var offsetX = -(PERSON_VIEW_W * scaleX) / 2;

    return (
      '<g class="figure-person" transform="translate(' + offsetX.toFixed(3) + ' 0) scale(' + scaleX.toFixed(5) + ' ' + scaleY.toFixed(5) + ')">' +
      '<g transform="' + PERSON_RAW_TRANSFORM + '">' +
      '<path class="person-figure" d="' + PERSON_PATH_D + '"/>' +
      "</g>" +
      "</g>"
    );
  }

  // ---- Board plan-shape outline ----
  //
  // Each archetype's outline is traced directly from a hand-drawn reference
  // shape (see /shapes/*.svg - real shaper-style rail lines), sampled into a
  // list of (t, widthFraction) control points: t is fraction of length from
  // nose (0) to tail (1), widthFraction is a fraction of the board's widest
  // half-width (1.0 = full width at that point). Points are joined with a
  // monotone cubic spline (see buildWidthSpline) so the curve's slope stays
  // continuous through every control point - no faceting, no seams.
  //
  // The right-side rail is sampled from t=0 (nose tip) up to `cornerT`
  // (usually 1.0 - either the rail tapers all the way to a point/flat edge
  // on its own, e.g. pin/round/squash tails, or it's cut short of full width).
  // A `notch` (swallow tail only) is one extra point placed directly into the
  // polygon *after* spline sampling, at a t *behind* cornerT - the notch tip
  // sits forward of the trailing wingtips, which is what makes it read as a
  // swallow cut rather than a straight taper.
  var OUTLINE_CURVES = {
    // Fish - blunt round nose, full round belly, deep swallow tail cut to the stringer.
    fish: {
      cornerT: 1.0,
      notch: { t: 0.932, widthFrac: 0 },
      points: [
        [0, 0], [0.04, 0.20], [0.08, 0.36], [0.12, 0.50], [0.16, 0.61], [0.20, 0.71],
        [0.24, 0.81], [0.28, 0.86], [0.32, 0.93], [0.36, 0.96], [0.40, 0.99],
        [0.46, 1.00], [0.50, 1.00], [0.56, 0.98], [0.62, 0.94], [0.68, 0.90],
        [0.74, 0.84], [0.80, 0.78], [0.86, 0.69], [0.92, 0.585], [0.96, 0.512], [1.00, 0.428]
      ]
    },
    // Performance shortboard - drawn-out pointed nose, curvy performance body, squash tail.
    shortboard: {
      cornerT: 1.0,
      notch: null,
      points: [
        [0, 0], [0.04, 0.14], [0.08, 0.27], [0.12, 0.44], [0.16, 0.53], [0.20, 0.65],
        [0.24, 0.75], [0.28, 0.83], [0.32, 0.88], [0.36, 0.94], [0.40, 0.96],
        [0.46, 0.99], [0.50, 0.99], [0.56, 1.00], [0.60, 0.99], [0.66, 0.97],
        [0.72, 0.91], [0.78, 0.83], [0.84, 0.72], [0.90, 0.60], [0.94, 0.52], [0.98, 0.43], [1.00, 0.378]
      ]
    },
    // Gun - long pulled-in point, narrow parallel section, pin tail tapering to a point.
    gun: {
      cornerT: 1.0,
      notch: null,
      points: [
        [0, 0], [0.04, 0.145], [0.08, 0.277], [0.12, 0.451], [0.16, 0.551], [0.20, 0.680],
        [0.24, 0.752], [0.28, 0.813], [0.32, 0.888], [0.36, 0.926], [0.40, 0.967],
        [0.46, 0.996], [0.50, 1.000], [0.56, 0.995], [0.62, 0.970], [0.68, 0.941],
        [0.74, 0.897], [0.80, 0.811], [0.86, 0.671], [0.90, 0.545], [0.94, 0.382], [0.98, 0.175], [1.00, 0]
      ]
    },
    // Funboard / mini-mal / soft-top - broad round nose, long full belly, tail rounds to a point.
    funboard: {
      cornerT: 1.0,
      notch: null,
      points: [
        [0, 0], [0.02, 0.39], [0.06, 0.65], [0.10, 0.80], [0.14, 0.89], [0.18, 0.94],
        [0.22, 0.97], [0.28, 1.00], [0.32, 1.00], [0.38, 0.997], [0.44, 0.985], [0.50, 0.971],
        [0.56, 0.952], [0.62, 0.927], [0.68, 0.896], [0.74, 0.847], [0.80, 0.803],
        [0.84, 0.753], [0.88, 0.677], [0.92, 0.569], [0.96, 0.389], [1.00, 0]
      ]
    },
    // Step-up - pointed nose, gun-style narrow body, short high tail chamfer (near-round tail).
    stepup: {
      cornerT: 1.0,
      notch: null,
      points: [
        [0, 0], [0.04, 0.209], [0.08, 0.361], [0.12, 0.531], [0.16, 0.650], [0.20, 0.728],
        [0.24, 0.819], [0.28, 0.857], [0.32, 0.907], [0.36, 0.935], [0.40, 0.968],
        [0.46, 0.990], [0.50, 0.995], [0.56, 0.999], [0.62, 0.990], [0.68, 0.961],
        [0.74, 0.916], [0.80, 0.858], [0.84, 0.791], [0.88, 0.719], [0.92, 0.621],
        [0.95, 0.50], [0.98, 0.30], [1.00, 0]
      ]
    },
    // Longboard - fullest, fastest-arriving round nose, long parallel outline, flat tail cut.
    longboard: {
      cornerT: 1.0,
      notch: null,
      points: [
        [0, 0], [0.02, 0.446], [0.06, 0.659], [0.10, 0.757], [0.14, 0.835], [0.18, 0.900],
        [0.22, 0.937], [0.26, 0.958], [0.30, 0.975], [0.36, 0.991], [0.42, 0.999], [0.46, 1.000],
        [0.50, 0.999], [0.56, 0.993], [0.62, 0.979], [0.68, 0.960], [0.74, 0.934], [0.80, 0.868],
        [0.86, 0.770], [0.90, 0.675], [0.94, 0.578], [0.98, 0.445], [1.00, 0.371]
      ]
    },
    // Groveler - no direct reference art; blends a quick round-nose entry (fish/funboard-like)
    // into a curvier performance body and squash tail, a touch fuller than the shortboard.
    groveler: {
      cornerT: 1.0,
      notch: null,
      points: [
        [0, 0], [0.04, 0.30], [0.08, 0.52], [0.12, 0.68], [0.16, 0.80], [0.20, 0.88],
        [0.26, 0.94], [0.32, 0.97], [0.38, 0.99], [0.44, 1.00], [0.50, 1.00],
        [0.56, 0.99], [0.62, 0.96], [0.68, 0.92], [0.74, 0.86], [0.80, 0.78],
        [0.86, 0.68], [0.90, 0.60], [0.94, 0.52], [0.98, 0.44], [1.00, 0.40]
      ]
    }
  };

  function buildControlPoints(outlineKey) {
    var cfg = OUTLINE_CURVES[outlineKey] || OUTLINE_CURVES.funboard;
    return { points: cfg.points, cornerT: cfg.cornerT, notch: cfg.notch };
  }

  // Builds a monotone cubic Hermite spline (Fritsch-Carlson) through an ascending
  // list of (t, widthFraction) points. Unlike piecewise linear/smoothstep interpolation
  // (which has zero slope at every control point, so the curve visibly flattens at
  // each one), this keeps the tangent continuous through every point, so nose, body
  // and tail control points read as one continuous rail line rather than a faceted
  // or kinked one.
  function buildWidthSpline(points) {
    var n = points.length;
    var ts = points.map(function (p) { return p[0]; });
    var ws = points.map(function (p) { return p[1]; });
    var delta = [];
    for (var i = 0; i < n - 1; i++) {
      delta.push((ws[i + 1] - ws[i]) / (ts[i + 1] - ts[i]));
    }
    var m = new Array(n);
    m[0] = delta[0];
    m[n - 1] = delta[n - 2];
    for (i = 1; i < n - 1; i++) {
      m[i] = delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
    }
    for (i = 0; i < n - 1; i++) {
      if (delta[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        var a = m[i] / delta[i];
        var b = m[i + 1] / delta[i];
        var s = a * a + b * b;
        if (s > 9) {
          var tau = 3 / Math.sqrt(s);
          m[i] = tau * a * delta[i];
          m[i + 1] = tau * b * delta[i];
        }
      }
    }
    return { ts: ts, ws: ws, m: m };
  }

  function evalWidthSpline(spline, t) {
    var ts = spline.ts;
    var n = ts.length;
    var i = 0;
    while (i < n - 2 && t > ts[i + 1]) {
      i++;
    }
    var h = ts[i + 1] - ts[i];
    var s = clamp((t - ts[i]) / h, 0, 1);
    var s2 = s * s;
    var s3 = s2 * s;
    var h00 = 2 * s3 - 3 * s2 + 1;
    var h10 = s3 - 2 * s2 + s;
    var h01 = -2 * s3 + 3 * s2;
    var h11 = s3 - s2;
    return (
      h00 * spline.ws[i] +
      h10 * h * spline.m[i] +
      h01 * spline.ws[i + 1] +
      h11 * h * spline.m[i + 1]
    );
  }

  // Builds the closed outline path (in inches, y down from nose=0 to tail=lengthIn).
  // The right-side samples run nose -> tail (+ a swallow notch point if applicable);
  // mirroring the full reversed set back to the nose gives one continuous, symmetric
  // closed loop (a flat tail edge or a symmetric V-notch falls out naturally).
  function buildBoardOutlineIn(lengthIn, widthIn, outlineKey, samples) {
    samples = samples || 64;
    var cfg = buildControlPoints(outlineKey);
    var spline = buildWidthSpline(cfg.points);
    var centerHalf = widthIn * 0.5;
    var right = [];
    for (var i = 0; i <= samples; i++) {
      var t = (i / samples) * cfg.cornerT;
      var half = evalWidthSpline(spline, t) * centerHalf;
      right.push([half, t * lengthIn]);
    }
    if (cfg.notch) {
      right.push([widthIn * cfg.notch.widthFrac, cfg.notch.t * lengthIn]);
    }
    var left = right
      .slice()
      .reverse()
      .map(function (p) {
        return [-p[0], p[1]];
      });
    return right.concat(left);
  }

  function buildBoardSvg(lengthIn, widthIn, outlineKey) {
    var lengthCm = lengthIn * 2.54;
    var points = buildBoardOutlineIn(lengthIn, widthIn, outlineKey).map(function (p) {
      return [p[0] * 2.54, p[1] * 2.54];
    });
    var d = pointsToD(points);
    return (
      '<g class="figure-board">' +
      '<path class="board-shape-glow" d="' + d + '"/>' +
      '<path class="board-shape" d="' + d + '"/>' +
      '<path class="board-shape-rail" d="' + d + '"/>' +
      '<line class="board-stringer" x1="0" y1="2" x2="0" y2="' + (lengthCm - 2).toFixed(2) + '"/>' +
      "</g>"
    );
  }

  // ---- Public render: side-by-side person + board on a shared cm scale ----
  function renderComparison(containerEl, params) {
    var heightCm = params.heightCm;
    var weightKg = params.weightKg;
    var board = params.board;
    var boardLengthCm = board.lengthIn * 2.54;
    var boardWidthCm = board.widthIn * 2.54;

    var wf = bodyWidthFactor(heightCm, weightKg);
    var personWidthCm = heightCm * wf * (PERSON_VIEW_W / PERSON_VIEW_H); // matches the rendered figure's own aspect ratio

    var padding = 24;
    var gap = 36;
    var maxFigureHeight = Math.max(heightCm, boardLengthCm);
    var totalHeight = maxFigureHeight + padding * 2 + 34; // extra for baseline labels
    var totalWidth = personWidthCm + gap + boardWidthCm + padding * 2 + 20;

    var personCx = padding + personWidthCm / 2;
    var boardCx = personCx + personWidthCm / 2 + gap + boardWidthCm / 2;

    var floorY = padding + maxFigureHeight;
    var personTopY = floorY - heightCm;
    var boardTopY = floorY - boardLengthCm;

    var personSvg = buildPersonSvg(heightCm, weightKg);
    var boardSvg = buildBoardSvg(board.lengthIn, board.widthIn, board.outlineKey);

    var svg =
      '<svg viewBox="0 0 ' + totalWidth.toFixed(1) + " " + totalHeight.toFixed(1) + '" ' +
      'preserveAspectRatio="xMidYMax meet" role="img" aria-label="' +
      (I18N ? I18N.t("silhouette.ariaLabel") : "Silhouette comparing the surfer's height to the recommended board's length and width") +
      '">' +
      '<defs>' +
      '<linearGradient id="boardFillGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#00f5ff" stop-opacity="0.38"/>' +
      '<stop offset="55%" stop-color="#5ee8d9" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="#7fb6ff" stop-opacity="0.30"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<line class="baseline" x1="' + padding.toFixed(1) + '" y1="' + floorY.toFixed(1) + '" x2="' + (totalWidth - padding).toFixed(1) + '" y2="' + floorY.toFixed(1) + '"/>' +
      '<g transform="translate(' + personCx.toFixed(1) + " " + personTopY.toFixed(1) + ')">' + personSvg + "</g>" +
      '<g transform="translate(' + boardCx.toFixed(1) + " " + boardTopY.toFixed(1) + ')">' + boardSvg + "</g>" +
      "</svg>";

    containerEl.innerHTML = svg;
  }

  global.Silhouette = { renderComparison: renderComparison };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.Silhouette;
  }
})(typeof window !== "undefined" ? window : globalThis);
