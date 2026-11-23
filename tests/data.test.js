const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../js/data.js");

test("20 Clubs, eindeutige Namen, gültige Farben", () => {
  assert.equal(D.TEAMS.length, 20);
  assert.equal(new Set(D.TEAMS.map((t) => t[0])).size, 20);
  for (const [, a, b] of D.TEAMS) { assert.match(a, /^#[0-9a-f]{6}$/i); assert.match(b, /^#[0-9a-f]{6}$/i); }
});

test("Finale: 5 Ballbesitze, nur der letzte ist final", () => {
  assert.equal(D.POSS.length, 5);
  assert.deepEqual(D.POSS.map((p) => !!p.final), [false, false, false, false, true]);
  assert.equal(D.POSS[4].pts, 3);
});

test("Erfolge haben eindeutige IDs", () => {
  assert.equal(new Set(D.ACHIEVEMENTS.map((a) => a.id)).size, D.ACHIEVEMENTS.length);
});
