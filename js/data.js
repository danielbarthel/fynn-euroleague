/* Statische Inhalte. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FYData = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // [Name, Primärfarbe, Sekundärfarbe]
  const TEAMS = [
    ["Real Madrid", "#f4f4f4", "#5b2a86"], ["FC Barcelona", "#a50044", "#004d98"], ["Fenerbahçe", "#002d72", "#ffed00"],
    ["Olympiacos", "#d50000", "#ffffff"], ["Panathinaikos", "#007a3d", "#ffffff"], ["Anadolu Efes", "#003c7e", "#e30613"],
    ["FC Bayern München", "#dc052d", "#ffffff"], ["Žalgiris Kaunas", "#006b3f", "#ffffff"], ["Partizan", "#1a1a1a", "#ffffff"],
    ["Crvena zvezda", "#e2001a", "#ffffff"], ["Maccabi Tel Aviv", "#ffd200", "#003399"], ["Hapoel Tel Aviv", "#e30613", "#ffffff"],
    ["AS Monaco", "#e10b17", "#ffffff"], ["Olimpia Milano", "#c8102e", "#ffffff"], ["Virtus Bologna", "#222222", "#ffffff"],
    ["Paris Basketball", "#111111", "#e6007e"], ["Baskonia", "#003da5", "#c8102e"], ["Valencia Basket", "#f39200", "#111111"],
    ["Dubai Basketball", "#141414", "#c9a24d"], ["ASVEL", "#003b7a", "#ffffff"],
  ];

  const NICKS = ["Mr. Final Four", "Der Clutch-Kaiser", "Fynnomenal", "Ice in the Veins", "Der Dreier-Doktor",
    "Captain Buzzer-Beater", "The Finisher", "Mr. Big Shot", "Der Netz-Flüsterer", "Splash-Fynn"];

  const QUOTES = [
    "Druck ist ein Privileg. Wer den letzten Ball will, hat ihn sich verdient.",
    "Die Würfe, die keiner sieht – im leeren Gym um 7 Uhr – gewinnen die Spiele, die alle sehen.",
    "Verpasster Wurf? Egal. Der nächste ist ein neuer Wurf.",
    "Defense gewinnt Titel. Aber ein Dreier mit Brett im Rücken tut's auch.",
    "Talent bringt dich ins Team. Arbeit bringt dich ins Final Four.",
    "Wenn die Halle laut wird, wird dein Kopf leise.",
    "Champions werden nicht im Mai gemacht, sondern im November.",
    "Ein guter Wurf beginnt in den Beinen und endet im Netz.",
    "Spiel jeden Ballbesitz, als wäre es der letzte im Finale.",
  ];

  const COMMENT = {
    make: ["{n} steigt hoch … TREFFER!", "Nichts als Netz! {n} ist nicht zu stoppen!", "BANG! {n} trifft und die Halle explodiert!", "Kalt wie Eis – {n} versenkt das Ding!"],
    bank: ["Übers Brett – zählt genauso! {n} mit Gefühl!"],
    roll: ["Der Ball tanzt auf dem Ring … und fällt rein! Glück ist auch ein Skill."],
    miss: ["Knapp daneben – {n} schüttelt sich kurz und läuft zurück.", "Vom Ring! Der nächste fällt, ganz sicher.", "Kein Glück diesmal – aber {n} will den Ball wieder haben."],
    fire: ["🔥 {n} IST ON FIRE! Drei in Folge – der Korb wirkt plötzlich riesig!"],
  };

  const POSS = [
    { x: 650, label: "Drive zur Zone", pts: 2, clock: "1:48", speed: 0.75 },
    { x: 520, label: "Pull-up aus der Mitteldistanz", pts: 2, clock: "1:12", speed: 0.9 },
    { x: 380, label: "Dreier über die Hand", pts: 3, clock: "0:41", speed: 1.0 },
    { x: 470, label: "Fadeaway nach Screen", pts: 2, clock: "0:15", speed: 1.0 },
    { x: 350, label: "DER LETZTE WURF", pts: 3, clock: "0:03", speed: 0.9, final: true },
  ];

  const RACKS = [
    { x: 340, label: "Ecke links" }, { x: 365, label: "Flügel links" }, { x: 395, label: "Top of the Key" },
    { x: 365, label: "Flügel rechts" }, { x: 340, label: "Ecke rechts" },
  ];

  const DIFFICULTY = {
    rookie: { label: "Rookie", speed: 0.7 },
    pro: { label: "Pro", speed: 1.0 },
    legend: { label: "Legende", speed: 1.4 },
  };

  const ACHIEVEMENTS = [
    { id: "first_title", icon: "🏆", name: "Champion", desc: "Gewinne deinen ersten EuroLeague-Titel." },
    { id: "buzzer", icon: "⏱️", name: "Buzzer-Beater", desc: "Triff den letzten Wurf im ersten Versuch." },
    { id: "perfect_final", icon: "💯", name: "Perfektes Finale", desc: "Triff alle 5 Würfe in einem Finale." },
    { id: "on_fire", icon: "🔥", name: "On Fire", desc: "Triff 3 Würfe in Folge." },
    { id: "bank", icon: "🪟", name: "Off the Glass", desc: "Triff einen Wurf übers Brett." },
    { id: "roll", icon: "🎲", name: "Ring-Roller", desc: "Triff, nachdem der Ball den Ring berührt hat." },
    { id: "legend_title", icon: "👑", name: "Legende", desc: "Hol den Titel auf Schwierigkeit „Legende“." },
    { id: "dynasty", icon: "🏛️", name: "Dynastie", desc: "Sammle 3 EuroLeague-Titel." },
    { id: "contest_15", icon: "🎯", name: "Scharfschütze", desc: "Erziele 15+ Punkte im Dreier-Contest." },
    { id: "contest_22", icon: "💦", name: "Splash King", desc: "Erziele 22+ Punkte im Dreier-Contest." },
    { id: "money_rack", icon: "💰", name: "Money Rack", desc: "Triff alle 5 Bälle eines Racks." },
    { id: "poster", icon: "📸", name: "Poster-Boy", desc: "Speichere oder teile deine Spielerkarte." },
  ];

  return { TEAMS, NICKS, QUOTES, COMMENT, POSS, RACKS, DIFFICULTY, ACHIEVEMENTS };
});
