/* Wurf-Physik – läuft im Browser (window.FYPhysics) und in Node (require) für Tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FYPhysics = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const C = Object.freeze({
    W: 900, H: 500, FLOOR: 440, RELEASE_Y: 318, G: 1500, R: 11,
    POWER_GAIN: 0.33,
    HOOP: Object.freeze({ x: 780, y: 200, front: 752, back: 808, board: 822, boardTop: 104, boardBottom: 220 }),
  });

  /** Abwurfwinkel abhängig von der Distanz (nah = steiler). */
  function angleFor(px) {
    return px > 600 ? 1.2 : 1.05;
  }

  /** Abwurfgeschwindigkeit, mit der der Ball exakt durch die Ringmitte fliegt. */
  function idealV(x0, th) {
    const dx = C.HOOP.x - x0, up = C.RELEASE_Y - C.HOOP.y;
    return Math.sqrt((C.G * dx * dx) / (2 * Math.cos(th) ** 2 * (dx * Math.tan(th) - up)));
  }

  /** err = Abweichung vom Ideal in Meter-Einheiten (0 = perfekt). */
  function makeBall(px, th, err) {
    const v = idealV(px, th) * (1 + err * C.POWER_GAIN);
    return { x: px + 14, y: C.RELEASE_Y, vx: v * Math.cos(th), vy: -v * Math.sin(th), t: 0, rot: 0, made: false, rim: false, board: false };
  }

  /** Ein Integrationsschritt. onEvent(type, intensity) für Sound/Effekte: 'rim' | 'board' | 'floor' | 'score'. */
  function stepBall(b, dt, onEvent) {
    const H = C.HOOP, R = C.R, py = b.y;
    b.vy += C.G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; b.rot += b.vx * dt * 0.05;

    for (const rx of [H.front, H.back]) {
      const dx = b.x - rx, dy = b.y - H.y, d = Math.hypot(dx, dy), min = R + 4;
      if (d < min && d > 0) {
        const nx = dx / d, ny = dy / d;
        b.x = rx + nx * min; b.y = H.y + ny * min;
        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) {
          b.vx -= 1.55 * vn * nx; b.vy -= 1.55 * vn * ny; b.vx *= 0.9;
          b.rim = true; onEvent && onEvent("rim", Math.min(1, -vn / 600));
        }
      }
    }
    if (b.x + R > H.board && b.y > 110 && b.y < 214 && b.vx > 0) {
      b.x = H.board - R; b.vx = -b.vx * 0.8; b.board = true;
      onEvent && onEvent("board", Math.min(1, Math.abs(b.vx) / 400));
    }
    if (b.y + R > C.FLOOR && b.vy > 0) {
      const imp = b.vy;
      b.y = C.FLOOR - R; b.vy = -b.vy * 0.55; b.vx *= 0.8;
      if (imp > 80) onEvent && onEvent("floor", Math.min(1, imp / 900));
    }
    if (!b.made && py < H.y && b.y >= H.y && b.vy > 0 && b.x > H.front + 4 && b.x < H.back - 4) {
      b.made = true; onEvent && onEvent("score", 1);
    }
    if (b.made && b.x > H.front && b.x < H.back && b.y > H.y && b.y < H.y + 50) b.vx *= 0.9;
  }

  function simShot(px, th, err) {
    const b = makeBall(px, th, err), dt = 1 / 360;
    for (let k = 0; k < 1440; k++) {
      stepBall(b, dt);
      if (b.made) return true;
      if (b.t > 1 && b.y > C.FLOOR - C.R - 2) return false;
    }
    return false;
  }

  /** Größtes zusammenhängendes Treffer-Fenster: {off, half} in Meter-Einheiten. */
  const cache = new Map();
  function findWindow(px, th) {
    const key = px + ":" + th;
    if (cache.has(key)) return cache.get(key);
    let best = [0, 0], cur = null;
    for (let i = -80; i <= 80; i++) {
      const e = i * 0.0025;
      if (simShot(px, th, e)) { if (cur === null) cur = e; if (e - cur > best[1] - best[0]) best = [cur, e]; }
      else cur = null;
    }
    const w = { off: (best[0] + best[1]) / 2, half: (best[1] - best[0]) / 2 };
    cache.set(key, w);
    return w;
  }

  return { C, angleFor, idealV, makeBall, stepBall, simShot, findWindow };
});
