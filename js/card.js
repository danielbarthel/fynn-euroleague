/* Schritt 1: Club wählen, Vertrag unterschreiben, Spielerkarte (inkl. PNG-Export). */
(function () {
  "use strict";
  const { TEAMS, NICKS } = FYData;
  const S = FYStore.state;
  const $ = (id) => document.getElementById(id);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let team = null;

  const name = () => ($("pname").value.trim() || "Fynn").slice(0, 14);
  const num = () => Math.max(0, Math.min(99, parseInt($("pnum").value, 10) || 7));
  const posShort = (p) => ({ "Point Guard": "PG", "Shooting Guard": "SG", "Small Forward": "SF", "Power Forward": "PF", Center: "C" })[p] || "SG";

  function applyTeam(t) {
    team = t;
    const root = document.documentElement.style;
    root.setProperty("--team1", t[1]);
    root.setProperty("--team2", t[2]);
    document.querySelectorAll(".team").forEach((b) => {
      const sel = b.dataset.team === t[0];
      b.classList.toggle("sel", sel);
      b.setAttribute("aria-pressed", String(sel));
    });
    document.dispatchEvent(new CustomEvent("fy:team", { detail: t }));
  }

  function syncName() {
    document.querySelectorAll(".pn").forEach((e) => (e.textContent = name()));
    document.dispatchEvent(new CustomEvent("fy:name"));
  }

  function buildGrid() {
    const grid = $("teams");
    TEAMS.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "team"; b.dataset.team = t[0]; b.setAttribute("aria-pressed", "false");
      const sw = document.createElement("i");
      sw.className = "sw"; sw.style.background = `linear-gradient(135deg, ${t[1]} 50%, ${t[2]} 50%)`;
      const label = document.createElement("span"); label.textContent = t[0];
      b.append(sw, label);
      b.addEventListener("click", () => { FYAudio.play("click"); applyTeam(t); });
      grid.appendChild(b);
    });
  }

  function rollCard() {
    const stats = [["SHOT", 90, 99], ["CLUTCH", 95, 99], ["IQ", 88, 98], ["DEF", 84, 95], ["PASS", 85, 97], ["HYPE", 99, 99]]
      .map(([k, a, b]) => [k, a + Math.floor(Math.random() * (b - a + 1))]);
    return {
      team: team[0], name: name(), num: num(), pos: $("ppos").value,
      nick: pick(NICKS), stats, years: 3 + Math.floor(Math.random() * 3),
      ovr: Math.round(stats.reduce((s, x) => s + x[1], 0) / stats.length),
    };
  }

  function renderCard(c) {
    $("cNum").textContent = c.num; $("cOvr").textContent = c.ovr; $("cPos").textContent = posShort(c.pos);
    $("cName").textContent = c.name.toUpperCase(); $("cNick").textContent = `„${c.nick}“`;
    $("cClub").textContent = `${c.team} · #${c.num}`;
    const st = $("cStats"); st.textContent = "";
    c.stats.forEach(([k, v]) => {
      const d = document.createElement("div"), b = document.createElement("b"), s = document.createElement("small");
      b.textContent = v; s.textContent = k; d.append(b, s); st.appendChild(d);
    });
    $("nHead").textContent = `${c.name} unterschreibt bei ${c.team}!`;
    $("nBody").textContent = `Es ist offiziell: ${c.name} („${c.nick}“) wechselt als ${c.pos} zu ${c.team} und unterschreibt einen ${c.years}-Jahres-Vertrag. Die Nummer ${c.num} ist bereits ausverkauft – noch bevor das Trikot überhaupt gedruckt wurde. Der Trainer spricht vom „wichtigsten Transfer der Vereinsgeschichte“.`;
    $("nQuote").textContent = `„Ich bin nicht hier, um mitzuspielen. Ich bin hier, um Titel zu holen.“ – ${c.name}`;
    $("signing").hidden = false;
  }

  function sign(reroll) {
    if (!team) applyTeam(pick(TEAMS));
    const c = rollCard();
    S.card = c; FYStore.save();
    renderCard(c); syncName();
    FYAudio.play(reroll ? "click" : "fanfare");
    if (!reroll) setTimeout(() => $("signing").scrollIntoView({ behavior: FYFx.reduced ? "auto" : "smooth", block: "center" }), 50);
  }

  /* ---------- PNG-Export ---------- */
  function cardCanvas(c) {
    const W = 720, H = 1020, cv = document.createElement("canvas"), x = cv.getContext("2d");
    cv.width = W; cv.height = H;
    const t = TEAMS.find((tt) => tt[0] === c.team) || TEAMS[0];
    const g = x.createLinearGradient(0, 0, W * 0.6, H);
    g.addColorStop(0, t[1]); g.addColorStop(0.75, "#0b0d12");
    x.fillStyle = "#0b0d12"; x.fillRect(0, 0, W, H);
    x.save(); x.beginPath(); x.roundRect(20, 20, W - 40, H - 40, 44); x.clip();
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // Glanzstreifen
    const sh = x.createLinearGradient(0, 0, W, H);
    sh.addColorStop(0.35, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(255,255,255,.14)"); sh.addColorStop(0.65, "rgba(255,255,255,0)");
    x.fillStyle = sh; x.fillRect(0, 0, W, H);
    x.restore();
    x.strokeStyle = "rgba(255,255,255,.25)"; x.lineWidth = 4; x.beginPath(); x.roundRect(20, 20, W - 40, H - 40, 44); x.stroke();

    const disp = "'Bebas Neue', Impact, sans-serif", sans = "Inter, system-ui, sans-serif";
    x.fillStyle = t[2]; x.globalAlpha = 0.22; x.font = `260px ${disp}`; x.textAlign = "right"; x.fillText(String(c.num), W - 60, 270); x.globalAlpha = 1;
    x.textAlign = "left"; x.fillStyle = "#fff";
    x.font = `170px ${disp}`; x.fillText(String(c.ovr), 64, 220);
    x.font = `800 32px ${sans}`; x.globalAlpha = 0.85; x.fillText(posShort(c.pos), 70, 270); x.globalAlpha = 1;
    x.font = `130px ${disp}`; x.fillText(c.name.toUpperCase(), 64, 520);
    x.fillStyle = "#ffd25a"; x.font = `800 30px ${sans}`; x.fillText(`„${c.nick}“`.toUpperCase(), 68, 570);
    x.fillStyle = "rgba(255,255,255,.8)"; x.font = `600 28px ${sans}`; x.fillText(`${c.team} · #${c.num}`, 68, 615);

    c.stats.forEach(([k, v], i) => {
      const col = i % 3, row = Math.floor(i / 3), bx = 64 + col * 202, by = 660 + row * 150;
      x.fillStyle = "rgba(0,0,0,.38)"; x.beginPath(); x.roundRect(bx, by, 186, 130, 22); x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center"; x.font = `76px ${disp}`; x.fillText(String(v), bx + 93, by + 82);
      x.font = `700 20px ${sans}`; x.globalAlpha = 0.75; x.fillText(k, bx + 93, by + 112); x.globalAlpha = 1;
    });
    x.textAlign = "center"; x.fillStyle = "rgba(255,255,255,.55)"; x.font = `600 22px ${sans}`;
    x.fillText("FYNNOMENAL · ROAD TO THE FINAL FOUR", W / 2, H - 50);
    return cv;
  }

  async function exportCard(share) {
    const c = S.card; if (!c) return;
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const blob = await new Promise((r) => cardCanvas(c).toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], `spielerkarte-${c.name.toLowerCase()}.png`, { type: "image/png" });
    if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Meine Spielerkarte", text: `${c.name} – ${c.team} #${c.num}` }); FYStore.unlock("poster"); }
      catch (e) { /* abgebrochen */ }
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    FYStore.unlock("poster");
  }

  /* ---------- Karte kippen ---------- */
  function tilt() {
    const card = $("card");
    if (FYFx.reduced) return;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${px * 16}deg) rotateX(${-py * 16}deg)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  }

  function init() {
    buildGrid(); tilt();
    $("pname").addEventListener("input", syncName);
    $("signBtn").addEventListener("click", () => sign(false));
    $("rerollBtn").addEventListener("click", () => sign(true));
    $("saveCardBtn").addEventListener("click", () => exportCard(false));
    const shareBtn = $("shareCardBtn");
    if (navigator.canShare) shareBtn.addEventListener("click", () => exportCard(true));
    else shareBtn.hidden = true;

    // gespeicherten Vertrag wiederherstellen
    if (S.card) {
      const t = TEAMS.find((tt) => tt[0] === S.card.team);
      if (t) applyTeam(t);
      $("pname").value = S.card.name; $("pnum").value = S.card.num; $("ppos").value = S.card.pos;
      renderCard(S.card);
      $("signBtn").textContent = "✍️ Neuen Vertrag unterschreiben";
    }
    syncName();
  }

  window.FYCard = {
    init,
    get team() { return team; },
    ensureTeam() { if (!team) applyTeam(pick(TEAMS)); return team; },
    name, num,
  };
})();
