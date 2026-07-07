(function () {
  var container = document.getElementById('bg-halftone');
  var canvas = document.getElementById('halftone-canvas');
  if (!container || !canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 768px)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduced || (conn && conn.saveData)) return;

  var MIN_DIST = mobile ? 14 : 12;
  var PAD = 22;
  var MOUSE_MS = 500;

  var state = {
    w: 0,
    h: 0,
    dpr: 1,
    mouseX: 0.35,
    mouseY: 0.42,
    ox: 0,
    oy: 0,
    points: [],
  };

  var ctx;
  var cache;
  var cacheCtx;
  var rafId = null;
  var resizeTimer = null;
  var mouseTimer = null;
  var live = false;
  var building = false;

  function hash(n) {
    return (((n * 2654435761) >>> 0) % 10000) / 10000;
  }

  function generatePoints(width, height) {
    var count = Math.floor((width * height) / (MIN_DIST * MIN_DIST * 1.2));
    var pts = new Array(count);
    for (var i = 0; i < count; i++) {
      pts[i] = {
        x: hash(i * 3 + 17) * width,
        y: hash(i * 7 + 41) * height,
        seed: hash(i * 11 + 3),
      };
    }
    return pts;
  }

  function luminance(x, y) {
    var heroX = state.w * 0.28;
    var heroY = state.h * 0.38;
    var cardX = state.w * 0.78;
    var cardY = state.h * 0.42;
    var mx = state.mouseX * state.w;
    var my = state.mouseY * state.h;

    var lum = 0.14;
    lum += Math.exp(-Math.hypot(x - heroX, y - heroY) / (state.w * 0.28)) * 0.52;
    lum += Math.exp(-Math.hypot(x - cardX, y - cardY) / (state.w * 0.24)) * 0.26;
    lum += Math.exp(-Math.hypot(x - mx, y - my) / (state.w * 0.2)) * 0.12;
    lum -= Math.hypot(x - state.w * 0.5, y - state.h * 0.5) / (Math.max(state.w, state.h) * 0.8) * 0.14;

    return lum < 0 ? 0 : lum > 1 ? 1 : lum;
  }

  function dotColor(x, y, lum, seed) {
    var nx = x / state.w;
    var ny = y / state.h;
    var shadow = 1 - lum;
    var r = 240;
    var g = 238;
    var b = 248;
    var mix = 0;

    if (seed < 0.08 + (1 - nx) * 0.18 + ny * 0.12) {
      r = 232; g = 48; b = 118; mix = 0.48;
    } else if (seed < 0.16 + nx * 0.14 + (1 - ny) * 0.1) {
      r = 58; g = 202; b = 214; mix = 0.42;
    } else if (seed < 0.21) {
      r = 245; g = 228; b = 78; mix = 0.28;
    }

    r = Math.round(r * mix + 240 * (1 - mix));
    g = Math.round(g * mix + 238 * (1 - mix));
    b = Math.round(b * mix + 248 * (1 - mix));

    return 'rgba(' + r + ',' + g + ',' + b + ',' + (0.038 + shadow * 0.08) + ')';
  }

  function rebuildCache() {
    if (!cacheCtx) return;
    var cw = cache.width;
    var ch = cache.height;
    cacheCtx.clearRect(0, 0, cw, ch);

    for (var i = 0; i < state.points.length; i++) {
      var p = state.points[i];
      var x = p.x;
      var y = p.y;
      var sx = x - PAD;
      var sy = y - PAD;
      var lum = luminance(sx, sy);
      var radius = MIN_DIST * 0.38 * (1.02 - lum);
      if (radius < 0.3) continue;

      cacheCtx.fillStyle = dotColor(sx, sy, lum, p.seed);
      cacheCtx.beginPath();
      cacheCtx.arc(x, y, radius, 0, Math.PI * 2);
      cacheCtx.fill();
    }
  }

  function blit() {
    if (!ctx || !cache) return;
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.drawImage(cache, state.ox - PAD, state.oy - PAD);
  }

  function build() {
    if (building) return;
    building = true;

    state.dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    state.w = window.innerWidth;
    state.h = window.innerHeight;

    canvas.width = state.w * state.dpr;
    canvas.height = state.h * state.dpr;
    canvas.style.width = state.w + 'px';
    canvas.style.height = state.h + 'px';

    ctx = canvas.getContext('2d');
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (!cache) cache = document.createElement('canvas');
    cache.width = state.w + PAD * 2;
    cache.height = state.h + PAD * 2;
    cacheCtx = cache.getContext('2d');

    state.points = generatePoints(cache.width, cache.height);
    rebuildCache();
    blit();

    if (!live) {
      container.classList.add('bg-halftone--live');
      live = true;
      if (!rafId) animate();
    }

    building = false;
  }

  function scheduleBuild() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(runIdleBuild, 200);
  }

  function runIdleBuild() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function () { build(); }, { timeout: 800 });
    } else {
      setTimeout(build, 0);
    }
  }

  function scheduleMouseRebuild() {
    if (mobile) return;
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(function () {
      rebuildCache();
      blit();
    }, MOUSE_MS);
  }

  function animate(now) {
    var t = (now || 0) * 0.001;
    state.ox = Math.sin(t * 0.38) * 1.1 + Math.sin(t * 0.76) * 0.4;
    state.oy = Math.cos(t * 0.33) * 0.9 + Math.cos(t * 0.68) * 0.35;
    blit();
    rafId = requestAnimationFrame(animate);
  }

  if (!mobile) {
    window.addEventListener('mousemove', function (e) {
      if (!live) return;
      state.mouseX = e.clientX / state.w;
      state.mouseY = e.clientY / state.h;
      scheduleMouseRebuild();
    }, { passive: true });
  }

  window.addEventListener('resize', scheduleBuild);
  window.addEventListener('load', scheduleBuild);

  window.addEventListener('pagehide', function () {
    if (rafId) cancelAnimationFrame(rafId);
  });
})();
