/* Verdrahtung: Navigation, Trophäenschrank, Erfolge, Sound-Schalter, PWA. */
(function () {
  "use strict";
  const ST = FYStore.state;
  const $ = (id) => document.getElementById(id);

  function renderCabinet() {
    $("kTitles").textContent = ST.titles;
    $("kMvp").textContent = ST.mvp;
    $("kBest").textContent = ST.contestBest;
    $("kPts").textContent = ST.pts;
    $("kPct").textContent = ST.shots ? Math.round((ST.makes / ST.shots) * 100) + " %" : "–";
    $("kClutch").textContent = ST.clutch;

    const shelf = $("shelf"); shelf.textContent = "";
    ST.shelf.forEach((s) => {
      const t = document.createElement("span");
      t.className = "cup"; t.textContent = "🏆";
      t.title = typeof s === "string" ? s : `${s.team} · ${s.score} · ${s.date}`;
      shelf.appendChild(t);
    });

    const grid = $("achievements"); grid.textContent = "";
    let got = 0;
    FYData.ACHIEVEMENTS.forEach((a) => {
      const on = !!ST.achievements[a.id]; if (on) got++;
      const el = document.createElement("div");
      el.className = "ach" + (on ? " on" : "");
      const ic = document.createElement("div"); ic.className = "ic"; ic.textContent = on ? a.icon : "🔒";
      const b = document.createElement("b"); b.textContent = a.name;
      const p = document.createElement("small"); p.textContent = a.desc;
      el.append(ic, b, p);
      el.setAttribute("aria-label", `${a.name}: ${a.desc} – ${on ? "freigeschaltet" : "noch gesperrt"}`);
      grid.appendChild(el);
    });
    $("achCount").textContent = `${got}/${FYData.ACHIEVEMENTS.length}`;
  }

  function soundToggle() {
    const btn = $("soundBtn");
    const paint = () => { btn.textContent = ST.muted ? "🔇" : "🔊"; btn.setAttribute("aria-label", ST.muted ? "Sound einschalten" : "Sound ausschalten"); btn.setAttribute("aria-pressed", String(!ST.muted)); };
    FYAudio.setMuted(ST.muted); paint();
    btn.addEventListener("click", () => { ST.muted = !ST.muted; FYAudio.setMuted(ST.muted); FYStore.save(); paint(); FYAudio.play("click"); });
  }

  function scrollButtons() {
    document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => {
      $(b.dataset.goto).scrollIntoView({ behavior: FYFx.reduced ? "auto" : "smooth" });
    }));
  }

  function navHighlight() {
    if (!("IntersectionObserver" in window)) return;
    const links = [...document.querySelectorAll(".nav a[href^='#']")];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["sign", "final", "cabinet"].forEach((id) => io.observe($(id)));
  }

  function resetButton() {
    let armed = false, t;
    const b = $("resetBtn");
    b.addEventListener("click", () => {
      if (!armed) { armed = true; b.textContent = "Wirklich alles löschen? Nochmal klicken"; t = setTimeout(() => { armed = false; b.textContent = "Karriere zurücksetzen"; }, 4000); return; }
      clearTimeout(t); armed = false; b.textContent = "Karriere zurücksetzen";
      FYStore.reset(); FYFx.toast("Karriere zurückgesetzt. Neue Saison, neues Glück!");
      setTimeout(() => location.reload(), 900);
    });
  }

  function pwa() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { /* offline-Modus optional */ }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("coachQ").textContent = "„" + FYData.QUOTES[new Date().getDate() % FYData.QUOTES.length] + "“";
    $("year").textContent = new Date().getFullYear();
    FYCard.init();
    FYGame.init();
    soundToggle(); scrollButtons(); navHighlight(); resetButton();
    renderCabinet(); FYStore.onChange(renderCabinet);
    document.addEventListener("pointerdown", () => FYAudio.unlock(), { once: true });
    pwa();
  });
})();
