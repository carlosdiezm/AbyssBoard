/*
 * Lightweight animated bioluminescent-particle backdrop.
 * Small glowing dots drift slowly upward and sway, like plankton lighting up
 * in dark water. Pauses entirely if the user prefers reduced motion, and
 * pauses when the tab is hidden to save battery.
 */
(function (global) {
  "use strict";

  function init(canvas) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var running = true;
    var reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var COLORS = ["#3fd2ff", "#5ee8d9", "#7fb6ff", "#4be3c1", "#67d6ff"];

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function seedParticles() {
      var count = Math.round((width * height) / 22000);
      count = Math.max(18, Math.min(90, count));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push(makeParticle(rand(0, height)));
      }
    }

    function makeParticle(startY) {
      return {
        x: rand(0, width),
        y: startY === undefined ? height + 10 : startY,
        r: rand(0.6, 2.4),
        speed: rand(6, 18), // px per second, upward
        drift: rand(-6, 6),
        sway: rand(0.6, 1.8),
        swayPhase: rand(0, Math.PI * 2),
        alpha: rand(0.35, 0.9),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        twinkleSpeed: rand(0.5, 1.6)
      };
    }

    var lastT = null;

    function frame(t) {
      if (!running) return;
      if (lastT === null) lastT = t;
      var dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;

      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed * dt;
        p.swayPhase += p.twinkleSpeed * dt;
        p.x += Math.sin(p.swayPhase) * p.sway * dt * 10;

        if (p.y < -10) {
          particles[i] = makeParticle(height + 10);
          continue;
        }

        var twinkle = 0.55 + 0.45 * Math.sin(p.swayPhase * 1.7);
        var alpha = p.alpha * twinkle;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.r * 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      global.requestAnimationFrame(frame);
    }

    resize();
    global.addEventListener("resize", resize);

    global.document.addEventListener("visibilitychange", function () {
      running = !global.document.hidden && !reduceMotion;
      if (running) {
        lastT = null;
        global.requestAnimationFrame(frame);
      }
    });

    if (reduceMotion) {
      // Draw a single static frame of soft glow points instead of animating.
      resize();
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.r * 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      return;
    }

    global.requestAnimationFrame(frame);
  }

  global.BioBackground = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
