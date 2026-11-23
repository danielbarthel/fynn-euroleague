const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const pages = ["index.html", "404.html", "datenschutz.html"];

test("alle lokal referenzierten Dateien existieren", () => {
  for (const page of pages) {
    const html = read(page);
    const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]).filter((r) => r && !r.startsWith("//"));
    for (const r of refs) {
      const p = r === "/" || r === "./" ? "index.html" : r.replace(/^\//, "");
      assert.ok(fs.existsSync(path.join(root, p)), `${page}: ${r} fehlt`);
    }
  }
});

test("CSP-tauglich: keine Inline-Skripte, -Handler oder -Styles", () => {
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, `${page}: Inline-Skript`);
    assert.doesNotMatch(html, /\son[a-z]+="/i, `${page}: Inline-Handler`);
    assert.doesNotMatch(html, /\sstyle="/i, `${page}: Inline-Style`);
    assert.doesNotMatch(html, /<style/i, `${page}: <style>-Block`);
  }
});

test("Service Worker cached nur existierende Dateien", () => {
  const sw = read("sw.js");
  const list = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"').replace(/,\s*\]/, "]"));
  for (const a of list) {
    const p = a === "./" ? "index.html" : a;
    assert.ok(fs.existsSync(path.join(root, p)), `sw.js: ${a} fehlt`);
  }
});

test("Dockerfile kopiert alle ausgelieferten Dateien", () => {
  const df = read("Dockerfile");
  for (const f of ["index.html", "404.html", "datenschutz.html", "sw.js", "manifest.webmanifest", "og.png", "css", "js", "fonts", "icons"]) {
    assert.ok(df.includes(f), `Dockerfile: ${f} fehlt`);
  }
});

test("Manifest ist gültiges JSON mit Icons", () => {
  const m = JSON.parse(read("manifest.webmanifest"));
  assert.ok(m.icons.length >= 2);
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(root, i.src)));
});
