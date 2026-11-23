/* Karriere-Speicher (localStorage, robust gegen gesperrten Speicher) + Erfolge. */
(function () {
  "use strict";
  const KEY = "fynnomenal-v2";
  const LEGACY = "fynnomenal-v1";
  const DEFAULTS = {
    titles: 0, mvp: 0, clutch: 0, pts: 0, shots: 0, makes: 0, contestBest: 0, contestRuns: 0,
    shelf: [], achievements: {}, difficulty: "pro", muted: false, card: null,
  };

  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

  const saved = read(KEY) || read(LEGACY) || {};
  const state = Object.assign({}, DEFAULTS, saved);
  if (!Array.isArray(state.shelf)) state.shelf = [];
  if (typeof state.achievements !== "object" || !state.achievements) state.achievements = {};

  const listeners = [];

  const Store = {
    state,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* privater Modus – egal */ }
      listeners.forEach((fn) => fn(state));
    },
    onChange(fn) { listeners.push(fn); },
    /** Schaltet einen Erfolg frei; gibt true zurück, wenn er neu ist. */
    unlock(id) {
      if (state.achievements[id]) return false;
      state.achievements[id] = new Date().toISOString();
      const a = FYData.ACHIEVEMENTS.find((x) => x.id === id);
      if (a) FYFx.toast(`${a.icon} Erfolg freigeschaltet: <b>${a.name}</b>`);
      FYAudio.play("unlock");
      Store.save();
      return true;
    },
    reset() {
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, JSON.parse(JSON.stringify(DEFAULTS)));
      Store.save();
    },
  };
  window.FYStore = Store;
})();
