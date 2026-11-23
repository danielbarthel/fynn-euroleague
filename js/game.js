/* Spiel: Final-Four-Finale + Dreier-Contest auf einer gemeinsamen Canvas-Engine. */
(function () {
  "use strict";
  const P = FYPhysics, C = P.C, HOOP = C.HOOP;
  const { POSS, RACKS, DIFFICULTY, COMMENT, TEAMS } = FYData;
  const ST = FYStore.state;
  const $ = (id) => document.getElementById(id);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const say = (t) => ($("ticker").textContent = t.replaceAll("{n}", FYCard.name()));

  const cv = $("court"), ctx = cv.getContext("2d");
  let colors = { t1: "#ff6a13", t2: "#ffffff" };
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const G = {
    mode: null, phase: "idle", balls: [], meter: 0, meterDir: 1, sweet: 0.5, win: { off: 0, half: 0.04 },
    px: 650, th: 1, speed: 1, label: "", pts: 2, money: false,
    streak: 0, fire: false, netSwish: 0, crowd: 0, reload: 0,
    f: null, c: null, opp: null,
  };

  /* ---------- Canvas-Setup ---------- */
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = C.W * dpr; cv.height = C.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const crowdDots = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 46; c++) crowdDots.push({ x: c * 20 + (r % 2) * 10, y: 40 + r * 22, team: (c * 7 + r * 3) % 5 === 0, a: 0.05 + ((c * 7 + r * 3) % 5) * 0.025, ph: c * 1.7 + r });

  /* ---------- Schuss-Setup ---------- */
  function setupShot(px, opts) {
    G.px = px; G.th = P.angleFor(px); G.win = P.findWindow(px, G.th);
    G.speed = opts.speed; G.label = opts.label; G.pts = opts.pts; G.money = !!opts.money;
    G.sweet = 0.25 + Math.random() * 0.5;
    G.meter = Math.random() * 0.15; G.meterDir = 1;
    G.phase = "aim";
  }
  function meterSpeed() {
    return G.speed * DIFFICULTY[ST.difficulty || "pro"].speed * (G.fire ? 0.8 : 1);
  }

  function shoot() {
    if (G.phase !== "aim") return;
    FYAudio.play("shoot");
    const b = P.makeBall(G.px, G.th, G.meter - G.sweet + G.win.off);
    b.meta = { pts: G.pts, money: G.money, rack: G.c ? G.c.rack : 0 };
    b.trail = [];
    G.balls.push(b);
    ST.shots++;
    if (G.mode === "final") {
      G.phase = "flight"; G.f.att++;
      say(POSS[G.f.i].final ? "Der Wurf ist unterwegs … die Halle hält den Atem an …" : "{n} drückt ab …");
    } else {
      G.c.att++; G.phase = "reload"; G.reload = 0.38;
      advanceContestBall();
    }
  }

  function onBallEvent(type, i) {
    if (type === "score") { G.netSwish = 1; FYAudio.play("swish"); FYFx.vibrate(30); }
    else FYAudio.play(type, i);
  }

  function updateBalls(dt) {
    for (const b of G.balls) {
      const n = 6;
      for (let k = 0; k < n; k++) P.stepBall(b, dt / n, onBallEvent);
      if (G.fire) { b.trail.push([b.x, b.y]); if (b.trail.length > 14) b.trail.shift(); } else b.trail.length = 0;
      if (!b.resolved) {
        const done = (b.made && b.y > HOOP.y + 45) || b.t > 4 || b.x < -30 || b.x > C.W + 30 ||
          (!b.made && b.t > 0.5 && b.y > HOOP.y + 70 && b.vy > 0) ||
          (!b.made && b.t > 0.9 && b.y > C.FLOOR - C.R - 2 && Math.abs(b.vy) < 120);
        if (done) { b.resolved = true; b.resolvedAt = b.t; resolve(b); }
      }
    }
    G.balls = G.balls.filter((b) => !b.resolved || b.t - b.resolvedAt < 1.4);
  }

  function streakUpdate(made) {
    if (made) {
      G.streak++;
      if (G.streak === 3 && !G.fire) {
        G.fire = true; FYAudio.play("fire"); FYFx.vibrate([40, 40, 80]);
        say(COMMENT.fire[0]); FYStore.unlock("on_fire");
      }
    } else { G.streak = 0; G.fire = false; }
  }

  function resolve(b) {
    if (b.made) {
      ST.makes++;
      if (b.board) FYStore.unlock("bank");
      if (b.rim) FYStore.unlock("roll");
    }
    streakUpdate(b.made);
    FYStore.save();
    if (G.mode === "final") finalResult(b);
    else if (G.mode === "contest") contestResult(b);
  }

  /* ---------- Modus: Finale ---------- */
  function startFinal() {
    clearTimers(); G.balls = []; G.streak = 0; G.fire = false;
    G.mode = "final";
    const team = FYCard.ensureTeam();
    do { G.opp = pick(TEAMS); } while (G.opp[0] === team[0]);
    G.f = { i: 0, home: 70, away: 72, made: 0, att: 0, pts: 0, retries: 0 };
    $("sHomeN").textContent = team[0]; $("sAwayN").textContent = G.opp[0]; $("sQ").textContent = "4. VIERTEL · FINALE";
    board();
    say(`Finale: ${team[0]} gegen ${G.opp[0]}. Zwei Minuten noch – und der Ball geht zu {n}!`);
    finalPossession();
  }
  function board() {
    if (G.mode === "final") { $("sHome").textContent = G.f.home; $("sAway").textContent = G.f.away; $("sClock").textContent = POSS[G.f.i].clock; }
    else if (G.mode === "contest") {
      $("sHome").textContent = G.c.score; $("sAway").textContent = Math.max(ST.contestBest, G.c.score);
      $("sClock").textContent = Math.ceil(G.c.time).toString().padStart(2, "0");
      $("sQ").textContent = `DREIER-CONTEST · RACK ${Math.min(5, G.c.rack + 1)}/5`;
    }
  }
  function finalPossession() {
    const p = POSS[G.f.i];
    setupShot(p.x, p); board();
    if (p.final) say("Auszeit vorbei. 3 Sekunden. 2 Punkte hinten. Alle wissen, wer den Ball bekommt … {n}!");
    else say(`${p.clock} – ${p.label}: {n} hat den Ball …`);
  }
  function finalResult(b) {
    const p = POSS[G.f.i], f = G.f;
    G.phase = "result";
    if (b.made) {
      f.home += p.pts; f.made++; f.pts += p.pts; ST.pts += p.pts; G.crowd = 1; FYAudio.play("cheer");
      const line = b.board ? pick(COMMENT.bank) : b.rim ? pick(COMMENT.roll) : pick(COMMENT.make);
      if (!(G.fire && G.streak === 3)) say(line + (p.pts === 3 ? " DREIER!" : ""));
    } else { FYAudio.play("groan"); say(pick(COMMENT.miss)); }
    FYStore.save(); board();

    if (p.final) { later(() => (b.made ? win() : overtime()), 900); return; }
    later(() => {
      f.i++;
      const next = POSS[f.i];
      let o = pick([0, 2, 2, 3]);
      if (next.final) o = Math.max(0, f.home + 2 - f.away);
      f.away += o; board();
      if (next.final) {
        FYAudio.play("buzzer");
        message("AUSZEIT!", `${G.opp[0]} trifft auf der anderen Seite. ${f.home}:${f.away} – ihr liegt 2 Punkte hinten. Noch 3 Sekunden. Coach malt einen Spielzug aufs Board: Der Ball geht zu ${FYCard.name()}. Dreier für die Meisterschaft.`,
          [["Ich nehm den Wurf 🔥", finalPossession]]);
      } else {
        say(o ? `${G.opp[0]} antwortet mit ${o} Punkten. Ball wieder bei ${FYCard.team[0]}!` : `Stop in der Defense! Ball wieder bei ${FYCard.team[0]}!`);
        later(finalPossession, 1100);
      }
    }, 1100);
  }
  function overtime() {
    G.f.retries++;
    message("SO KNAPP!", `Der Ball tanzt auf dem Ring … und fällt raus. Aber warte – Foul beim Wurf! Die Schiris checken das Video … neue 3 Sekunden. ${FYCard.name()} bekommt noch eine Chance!`,
      [["Nochmal! 💪", () => { G.f.away = G.f.home + 2; finalPossession(); }]]);
  }
  function win() {
    G.phase = "idle";
    const f = G.f, team = FYCard.team, n = FYCard.name();
    ST.titles++; ST.mvp++; ST.clutch++;
    ST.shelf.push({ team: team[0], date: new Date().toLocaleDateString("de-DE"), diff: ST.difficulty, score: `${f.home}:${f.away}` });
    FYStore.save();
    FYStore.unlock("first_title");
    if (f.retries === 0) FYStore.unlock("buzzer");
    if (f.made === 5 && f.att === 5) FYStore.unlock("perfect_final");
    if (ST.difficulty === "legend") FYStore.unlock("legend_title");
    if (ST.titles >= 3) FYStore.unlock("dynasty");

    $("chClub").textContent = `${team[0]} · EuroLeague-Champion`;
    const t = $("chText"); t.textContent = "";
    t.append(`Mit der Schlusssirene! ${n} trifft den Dreier zum `, strong(`${f.home}:${f.away}`), ` gegen ${G.opp[0]} und holt den EuroLeague-Titel. Die Mitspieler begraben ${n} unter sich, die Fans stürmen fast das Parkett – und irgendwo schreibt ein Reporter schon die Schlagzeile: `, strong(`„${n.toUpperCase()} – EINFACH FYNNOMENAL.“`));
    const box = $("chBox"); box.textContent = "";
    [[f.pts, "PUNKTE (CLUTCH)"], [`${f.made}/${f.att}`, "WÜRFE"], [ST.titles, "TITEL INSGESAMT"]].forEach(([v, l]) => {
      const d = document.createElement("div"); d.append(strong(String(v))); const s = document.createElement("small"); s.textContent = l; d.append(s); box.append(d);
    });
    G.lastResult = `🏆 ${n} hat mit ${team[0]} das EuroLeague-Finale ${f.home}:${f.away} gegen ${G.opp[0]} gewonnen – mit dem Dreier zum Sieg!`;
    FYAudio.play("buzzer"); setTimeout(() => FYAudio.play("fanfare"), 700); setTimeout(() => FYAudio.play("cheer"), 900);
    FYFx.vibrate([80, 60, 80, 60, 200]);
    const ch = $("champ"); ch.hidden = false; $("againBtn").focus({ preventScroll: true });
    FYFx.confetti(["#ffd25a", "#ff6a13", "#ffffff", colors.t1, colors.t2, "#34d399"]);
  }
  function strong(s) { const b = document.createElement("b"); b.textContent = s; return b; }

  /* ---------- Modus: Dreier-Contest ---------- */
  function startContest() {
    clearTimers(); G.balls = []; G.streak = 0; G.fire = false;
    G.mode = "contest";
    FYCard.ensureTeam();
    G.c = { time: 60, rack: 0, ball: 0, score: 0, made: 0, att: 0, running: true, rackMakes: [0, 0, 0, 0, 0] };
    $("sHomeN").textContent = FYCard.name(); $("sAwayN").textContent = "Rekord";
    board();
    say("Dreier-Contest! 5 Racks, 25 Bälle, 60 Sekunden. Der fünfte Ball jedes Racks ist der 💰 Money Ball (2 Punkte).");
    FYAudio.play("buzzer");
    contestShot();
  }
  function contestShot() {
    const c = G.c, r = RACKS[c.rack];
    setupShot(r.x, { speed: 0.95 + c.rack * 0.05, label: `${r.label} · Ball ${c.ball + 1}/5`, pts: c.ball === 4 ? 2 : 1, money: c.ball === 4 });
  }
  function advanceContestBall() {
    const c = G.c;
    c.ball++;
    if (c.ball === 5) { c.ball = 0; c.rack++; G.reload = 0.75; }
    if (c.rack >= 5) { c.running = false; G.phase = "wait"; }
    board();
  }
  function contestResult(b) {
    const c = G.c;
    if (b.made) {
      c.score += b.meta.pts; c.made++; ST.pts += b.meta.pts; G.crowd = Math.min(1, G.crowd + 0.5);
      c.rackMakes[b.meta.rack]++;
      if (c.rackMakes[b.meta.rack] === 5) FYStore.unlock("money_rack");
      if (b.meta.money) say("💰 MONEY BALL! +2"); else if (!(G.fire && G.streak === 3)) say(`Treffer! ${c.score} Punkte.`);
      if (b.meta.money) FYAudio.play("cheer");
    }
    board();
    maybeFinishContest();
  }
  function maybeFinishContest() {
    const c = G.c;
    if (c.running || G.balls.some((b) => !b.resolved) || G.phase === "over") return;
    G.phase = "over";
    const prevBest = ST.contestBest, rec = c.score > prevBest;
    ST.contestBest = Math.max(prevBest, c.score); ST.contestRuns++;
    FYStore.save();
    if (c.score >= 15) FYStore.unlock("contest_15");
    if (c.score >= 22) FYStore.unlock("contest_22");
    board();
    const quote = c.score >= 22 ? "Historisch. Die Halle steht." : c.score >= 15 ? "Richtig stark – Scharfschützen-Niveau!" : c.score >= 8 ? "Solide! Mit Training geht da noch mehr." : "Aufwärmen gehört dazu. Nächste Runde!";
    if (rec) { FYAudio.play("fanfare"); FYFx.confetti(["#ffd25a", "#ff6a13", "#ffffff", colors.t1]); setTimeout(FYFx.stopConfetti, 3500); }
    G.lastResult = `🎯 ${FYCard.name()} hat im Dreier-Contest ${c.score} Punkte geholt (${c.made}/${c.att} Treffer).`;
    message(rec ? "NEUER REKORD! 🎉" : "ZEIT!", `${c.score} Punkte · ${c.made}/${c.att} Treffer. ${quote}${rec && prevBest ? ` Alter Rekord: ${prevBest}.` : ""}`,
      [["🔁 Nochmal", startContest], ["Menü", showMenu]]);
  }

  /* ---------- Overlays ---------- */
  function message(h, p, buttons) {
    $("msgH").textContent = h; $("msgP").textContent = p;
    const row = $("msgBtns"); row.textContent = "";
    buttons.forEach(([label, fn], i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = i === 0 ? "cta" : "ghost"; b.textContent = label;
      b.addEventListener("click", () => { $("msgOv").hidden = true; FYAudio.play("click"); fn(); focusCourt(); });
      row.appendChild(b);
    });
    $("msgOv").hidden = false;
    row.firstChild.focus({ preventScroll: true });
  }
  function showMenu() {
    clearTimers(); G.mode = null; G.phase = "idle"; G.balls = [];
    $("startOv").hidden = false;
  }
  function focusCourt() { cv.focus({ preventScroll: true }); }

  /* ---------- Zeichnen ---------- */
  function drawCourt(now) {
    const sky = ctx.createLinearGradient(0, 0, 0, C.FLOOR);
    sky.addColorStop(0, "#07080c"); sky.addColorStop(1, "#141826");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, C.W, C.FLOOR);
    for (const d of crowdDots) {
      const jump = G.crowd > 0 && !FYFx.reduced ? Math.sin(d.ph + now / 90) * G.crowd * 5 : 0;
      ctx.fillStyle = d.team ? colors.t1 : `rgba(255,255,255,${d.a})`;
      ctx.beginPath(); ctx.arc(d.x, d.y + jump, 6, 0, 7); ctx.fill();
    }
    if (G.crowd > 0.3 && !FYFx.reduced) for (let i = 0; i < 4; i++) { ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(Math.random() * C.W, 40 + Math.random() * 120, 2 + Math.random() * 3, 0, 7); ctx.fill(); }
    // LED-Bande
    ctx.fillStyle = G.fire ? "#ff3d00" : "rgba(255,106,19,.92)"; ctx.fillRect(0, 178, C.W, 26);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 178, C.W, 26); ctx.clip();
    ctx.fillStyle = "#111"; ctx.font = "800 15px Inter, sans-serif"; ctx.textAlign = "left";
    const txt = G.mode === "contest" ? "  DREIER-CONTEST · SPLASH ZONE · MONEY BALL ·" : "  FINAL FOUR · CHAMPIONSHIP GAME · " + FYCard.name().toUpperCase() + " ·";
    const tw = ctx.measureText(txt).width, off = FYFx.reduced ? 0 : (now / 25) % tw;
    for (let x = -off; x < C.W; x += tw) ctx.fillText(txt, x, 197);
    ctx.restore();
    // Parkett
    const fl = ctx.createLinearGradient(0, C.FLOOR, 0, C.H);
    fl.addColorStop(0, "#c98a4b"); fl.addColorStop(1, "#8a5a2b");
    ctx.fillStyle = fl; ctx.fillRect(0, C.FLOOR, C.W, C.H - C.FLOOR);
    ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1;
    for (let x = 0; x < C.W; x += 36) { ctx.beginPath(); ctx.moveTo(x, C.FLOOR); ctx.lineTo(x - 20, C.H); ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(405, C.FLOOR + 2); ctx.lineTo(392, C.H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(600, C.FLOOR + 2); ctx.lineTo(592, C.H); ctx.stroke();
    ctx.fillStyle = "#555c6e"; ctx.fillRect(860, 150, 10, C.FLOOR - 150); ctx.fillRect(826, 160, 40, 8);
    ctx.fillStyle = "rgba(230,240,255,.85)"; ctx.fillRect(HOOP.board, HOOP.boardTop, 8, HOOP.boardBottom - HOOP.boardTop);
    ctx.strokeStyle = "#ff3b3b"; ctx.lineWidth = 2; ctx.strokeRect(HOOP.board + 1, 168, 6, 30);
  }
  function drawNet(now) {
    const sw = G.netSwish;
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.5;
    const bl = HOOP.front + 12, br = HOOP.back - 12, depth = 46 + sw * 10;
    for (let i = 0; i <= 6; i++) {
      const tx = HOOP.front + ((HOOP.back - HOOP.front) * i) / 6;
      const bx = bl + ((br - bl) * i) / 6 + Math.sin(now / 40 + i) * sw * 4;
      ctx.beginPath(); ctx.moveTo(tx, HOOP.y); ctx.lineTo(bx, HOOP.y + depth); ctx.stroke();
    }
    for (let k = 1; k <= 3; k++) {
      const y = HOOP.y + (depth * k) / 3.3, s = (12 * k) / 3;
      ctx.beginPath(); ctx.moveTo(HOOP.front + s, y); ctx.lineTo(HOOP.back - s, y); ctx.stroke();
    }
  }
  function drawRim() {
    ctx.strokeStyle = G.fire ? "#ffb300" : "#ff5a1f"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(HOOP.front, HOOP.y); ctx.lineTo(HOOP.board, HOOP.y); ctx.stroke();
  }
  function drawPlayer() {
    if (!G.mode) return;
    const x = G.px, last = G.balls[G.balls.length - 1];
    const jump = last && !last.resolved && last.t < 0.5 && G.mode === "final" ? Math.sin((last.t / 0.5) * Math.PI) * 28 : 0;
    const fy = C.FLOOR - jump;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, C.FLOOR + 4, 28 - jump * 0.3, 6, 0, 0, 7); ctx.fill();
    if (G.fire) { const gl = ctx.createRadialGradient(x, fy - 80, 10, x, fy - 80, 110); gl.addColorStop(0, "rgba(255,120,0,.35)"); gl.addColorStop(1, "rgba(255,120,0,0)"); ctx.fillStyle = gl; ctx.fillRect(x - 120, fy - 200, 240, 220); }
    ctx.strokeStyle = "#6b4226"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 8, fy - 50); ctx.lineTo(x - 10, fy - 4); ctx.moveTo(x + 8, fy - 50); ctx.lineTo(x + 10, fy - 4); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillRect(x - 20, fy - 8, 16, 8); ctx.fillRect(x + 4, fy - 8, 16, 8);
    ctx.fillStyle = colors.t1; ctx.fillRect(x - 18, fy - 70, 36, 26);
    ctx.beginPath(); ctx.roundRect(x - 20, fy - 122, 40, 56, 8); ctx.fill();
    ctx.strokeStyle = colors.t2; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = colors.t2; ctx.font = "22px 'Bebas Neue', Impact, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(String(FYCard.num()), x, fy - 84);
    ctx.strokeStyle = "#6b4226"; ctx.lineWidth = 8;
    const up = G.phase === "aim" ? 0.2 : 1;
    ctx.beginPath(); ctx.moveTo(x + 14, fy - 114); ctx.lineTo(x + 20, fy - 120 - up * 30); ctx.moveTo(x - 14, fy - 114); ctx.lineTo(x + 6, fy - 122 - up * 24); ctx.stroke();
    ctx.fillStyle = "#6b4226"; ctx.beginPath(); ctx.arc(x, fy - 138, 15, 0, 7); ctx.fill();
    ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(x, fy - 143, 15, Math.PI, 0); ctx.fill();
    const nm = FYCard.name().toUpperCase() + (G.fire ? " 🔥" : "");
    ctx.font = "700 13px Inter, sans-serif"; const w = ctx.measureText(nm).width + 16;
    ctx.fillStyle = G.fire ? "rgba(255,80,0,.85)" : "rgba(0,0,0,.6)"; ctx.beginPath(); ctx.roundRect(x - w / 2, fy - 178, w, 20, 6); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(nm, x, fy - 163);
  }
  function drawBall(x, y, rot, money, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot || 0);
    const gr = ctx.createRadialGradient(-4, -4, 2, 0, 0, C.R);
    if (money) { gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#d9530a"); } else { gr.addColorStop(0, "#ffb06a"); gr.addColorStop(1, "#d9530a"); }
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, C.R, 0, 7); ctx.fill();
    ctx.strokeStyle = money ? "#1d4ed8" : "#2a1205"; ctx.lineWidth = money ? 2 : 1.2;
    ctx.beginPath(); ctx.moveTo(-C.R, 0); ctx.lineTo(C.R, 0); ctx.moveTo(0, -C.R); ctx.lineTo(0, C.R); ctx.stroke();
    ctx.restore();
  }
  function drawTrail(b) {
    b.trail.forEach(([x, y], i) => {
      const a = i / b.trail.length;
      ctx.fillStyle = `rgba(255,${120 + a * 100},0,${a * 0.55})`;
      ctx.beginPath(); ctx.arc(x, y, C.R * (0.4 + a * 0.8), 0, 7); ctx.fill();
    });
  }
  function drawMeter() {
    const x = 24, y = 230, w = 26, h = 190;
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.roundRect(x - 6, y - 30, w + 12, h + 40, 10); ctx.fill();
    ctx.fillStyle = "#2a3145"; ctx.fillRect(x, y, w, h);
    const half = Math.min(0.08, G.win.half), zy = y + h * (1 - (G.sweet + half)), zh = h * half * 2;
    ctx.fillStyle = G.fire ? "rgba(255,170,0,.95)" : "rgba(52,211,153,.9)"; ctx.fillRect(x, zy, w, zh);
    const my = y + h * (1 - G.meter);
    ctx.fillStyle = "#fff"; ctx.fillRect(x - 6, my - 2, w + 12, 4);
    ctx.beginPath(); ctx.moveTo(x + w + 6, my); ctx.lineTo(x + w + 14, my - 7); ctx.lineTo(x + w + 14, my + 7); ctx.fill();
    ctx.font = "700 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#cfd5e3"; ctx.fillText("POWER", x + w / 2, y - 12);
    ctx.textAlign = "left"; ctx.font = "700 15px Inter, sans-serif";
    const fin = G.mode === "final" && POSS[G.f.i].final;
    ctx.fillStyle = fin ? "#ffd25a" : G.money ? "#93c5fd" : "#fff";
    ctx.fillText((fin ? "⚡ " : G.money ? "💰 " : "") + G.label + ` · ${G.pts} PKT`, 80, 250);
    ctx.font = "13px Inter, sans-serif"; ctx.fillStyle = "#9aa3b8"; ctx.fillText("Klick / Tippen / Leertaste zum Werfen", 80, 270);
  }
  function drawRack() {
    if (G.mode !== "contest") return;
    const c = G.c;
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.roundRect(78, 452, 150, 36, 10); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const left = c.rack < 5 && i >= c.ball;
      drawBall(98 + i * 27, 470, 0, i === 4, left ? 1 : 0.18);
    }
    if (G.c.time <= 10 && G.c.running) {
      ctx.fillStyle = `rgba(244,63,94,${0.5 + 0.5 * Math.sin(performance.now() / 120)})`;
      ctx.font = "64px 'Bebas Neue', Impact, sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.ceil(G.c.time), C.W / 2, 160);
    }
  }

  /* ---------- Loop ---------- */
  let lastT = 0;
  function frame(t) {
    const dt = Math.min(0.033, (t - (lastT || t)) / 1000); lastT = t;
    if (G.phase === "aim") {
      G.meter += G.meterDir * dt * meterSpeed();
      if (G.meter > 1) { G.meter = 1; G.meterDir = -1; }
      if (G.meter < 0) { G.meter = 0; G.meterDir = 1; }
    }
    if (G.mode === "contest") {
      const c = G.c;
      if (c.running) {
        const before = Math.ceil(c.time);
        c.time = Math.max(0, c.time - dt);
        if (Math.ceil(c.time) !== before) board();
        if (c.time <= 0) { c.running = false; G.phase = "wait"; FYAudio.play("buzzer"); say("ZEIT! Bälle in der Luft zählen noch …"); }
      }
      if (G.phase === "reload") { G.reload -= dt; if (G.reload <= 0) contestShot(); }
      if (G.phase === "wait") maybeFinishContest();
    }
    updateBalls(dt);
    G.netSwish = Math.max(0, G.netSwish - dt * 1.5);
    G.crowd = Math.max(0, G.crowd - dt * 0.5);

    drawCourt(t); drawNet(t); drawPlayer();
    if (G.mode && (G.phase === "aim" || G.phase === "reload")) drawBall(G.px + 16, C.RELEASE_Y + 70, 0, G.money);
    for (const b of G.balls) { drawTrail(b); drawBall(b.x, b.y, b.rot, b.meta.money, b.resolved ? Math.max(0, 1 - (b.t - b.resolvedAt) / 1.4) : 1); }
    if (G.phase === "aim") drawMeter();
    drawRack();
    drawRim();
    for (const b of G.balls) if (b.y < HOOP.y && b.x > HOOP.front - C.R && b.x < HOOP.back + C.R) drawBall(b.x, b.y, b.rot, b.meta.money);
    requestAnimationFrame(frame);
  }

  /* ---------- Init ---------- */
  function setDifficulty(d) {
    ST.difficulty = d; FYStore.save();
    document.querySelectorAll("[data-diff]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.diff === d)));
  }
  function init() {
    fit(); addEventListener("resize", fit);
    const readColors = () => { const cs = getComputedStyle(document.documentElement); colors = { t1: cs.getPropertyValue("--team1").trim() || "#ff6a13", t2: cs.getPropertyValue("--team2").trim() || "#fff" }; };
    readColors(); document.addEventListener("fy:team", readColors);
    document.addEventListener("fy:team", () => { if (G.mode === "final") $("sHomeN").textContent = FYCard.team[0]; });

    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); FYAudio.unlock(); shoot(); });
    addEventListener("keydown", (e) => {
      if ((e.code === "Space" || e.code === "Enter") && G.phase === "aim") {
        const a = document.activeElement;
        if (a && a !== document.body && a !== cv) return;
        e.preventDefault(); shoot();
      }
    });
    document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      FYAudio.unlock(); FYAudio.play("click");
      $("startOv").hidden = true;
      (b.dataset.mode === "contest" ? startContest : startFinal)();
      focusCourt();
    }));
    document.querySelectorAll("[data-diff]").forEach((b) => b.addEventListener("click", () => { FYAudio.play("click"); setDifficulty(b.dataset.diff); }));
    setDifficulty(ST.difficulty || "pro");
    $("menuBtn").addEventListener("click", showMenu);

    const closeChamp = () => { FYFx.stopConfetti(); $("champ").hidden = true; };
    $("againBtn").addEventListener("click", () => { closeChamp(); $("final").scrollIntoView({ behavior: FYFx.reduced ? "auto" : "smooth" }); setTimeout(() => { startFinal(); focusCourt(); }, 400); });
    $("closeBtn").addEventListener("click", () => { closeChamp(); showMenu(); $("cabinet").scrollIntoView({ behavior: FYFx.reduced ? "auto" : "smooth" }); });
    $("shareResultBtn").addEventListener("click", shareResult);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("champ").hidden) closeChamp(); });

    requestAnimationFrame(frame);
  }
  async function shareResult() {
    const text = (G.lastResult || "Fynnomenal!") + " " + location.href.split("#")[0];
    if (navigator.share) { try { await navigator.share({ title: "Fynnomenal", text }); } catch (e) { /* abgebrochen */ } return; }
    try { await navigator.clipboard.writeText(text); FYFx.toast("📋 Ergebnis kopiert – jetzt einfügen und angeben!"); }
    catch (e) { FYFx.toast(text, 6000); }
  }

  window.FYGame = { init, startFinal, startContest, showMenu };
  // Nur für Tests: ?debug in der URL gibt Zugriff auf den Spielzustand.
  if (/[?&]debug\b/.test(location.search)) window.FYGame.debug = { G, perfect() { G.meter = G.sweet; shoot(); } };
})();
