/* Visuelle Effekte: Toasts, Konfetti, Vibration. */
(function () {
  "use strict";
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toast(html, ms = 3200) {
    const box = document.getElementById("toasts");
    if (!box) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = html;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 400); }, ms);
  }

  let running = false;
  function confetti(colors) {
    const c = document.getElementById("confetti"), x = c.getContext("2d");
    c.hidden = false;
    const fit = () => { c.width = innerWidth; c.height = innerHeight; };
    fit(); addEventListener("resize", fit);
    const n = reduced ? 60 : 260;
    const P = Array.from({ length: n }, () => ({
      x: Math.random() * c.width, y: -Math.random() * c.height, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      r: Math.random() * 6, s: 4 + Math.random() * 7, c: colors[Math.floor(Math.random() * colors.length)], w: Math.random() * 10,
    }));
    running = true;
    (function tick() {
      x.clearRect(0, 0, c.width, c.height);
      if (!running) { c.hidden = true; removeEventListener("resize", fit); return; }
      for (const p of P) {
        p.x += p.vx + Math.sin((p.w += 0.05)); p.y += reduced ? p.vy * 0.5 : p.vy; p.r += 0.1;
        if (p.y > c.height + 20) { p.y = -20; p.x = Math.random() * c.width; }
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore();
      }
      requestAnimationFrame(tick);
    })();
  }

  window.FYFx = {
    reduced,
    toast,
    confetti,
    stopConfetti() { running = false; },
    vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* nicht unterstützt */ } },
  };
})();
