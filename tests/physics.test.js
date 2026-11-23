const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../js/physics.js");
const D = require("../js/data.js");

const positions = [...new Set([...D.POSS.map((p) => p.x), ...D.RACKS.map((r) => r.x)])];

test("idealV ist endlich und positiv für alle Wurfpositionen", () => {
  for (const x of positions) {
    const v = P.idealV(x, P.angleFor(x));
    assert.ok(Number.isFinite(v) && v > 0, `x=${x} v=${v}`);
  }
});

test("jede Wurfposition hat ein spielbares Treffer-Fenster", () => {
  for (const x of positions) {
    const th = P.angleFor(x), w = P.findWindow(x, th);
    assert.ok(w.half >= 0.025, `x=${x}: Fenster zu klein (${w.half})`);
    assert.ok(P.simShot(x, th, w.off), `x=${x}: Mitte des Fensters trifft nicht`);
  }
});

test("Treffen ist nicht geschenkt: die meisten Balkenstellungen gehen daneben", () => {
  for (const x of positions) {
    const th = P.angleFor(x);
    let makes = 0, n = 0;
    for (let e = -0.75; e <= 0.75; e += 0.01) { n++; if (P.simShot(x, th, e)) makes++; }
    assert.ok(makes / n < 0.35, `x=${x}: ${Math.round((makes / n) * 100)} % Treffer – zu leicht`);
    assert.equal(P.simShot(x, th, -0.75), false, `x=${x}: viel zu schwacher Wurf trifft`);
  }
});

test("Ereignisse werden gemeldet (score bei Treffer)", () => {
  const x = 520, th = P.angleFor(x), w = P.findWindow(x, th);
  const b = P.makeBall(x, th, w.off), events = [];
  for (let i = 0; i < 1440 && !b.made; i++) P.stepBall(b, 1 / 360, (t) => events.push(t));
  assert.ok(events.includes("score"));
});
