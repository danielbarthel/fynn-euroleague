# Fynnomenal – Road to the Final Four

Ein kleines EuroLeague-Basketballspiel für Fynn. Live: https://fynn.wepp-solutions.de

## Features
- **Transfer:** Club aus allen 20 EuroLeague-Clubs wählen, Spielerkarte mit Stats & Spitznamen, BREAKING-News.
  Karte als PNG speichern oder per Web Share teilen. Der Vertrag bleibt gespeichert.
- **Final-Four-Finale:** 5 Ballbesitze in der Crunchtime, der letzte ist der Dreier um den Titel. Titel-Feier mit Konfetti & Fanfare.
- **Dreier-Contest:** 5 Racks, 25 Bälle, 60 Sekunden, Money Balls (2 Punkte), Rekord.
- **Echte Wurf-Physik:** Ring, Brett, Boden; das grüne Feld im Power-Balken wird aus der Simulation berechnet.
- **On Fire:** 3 Treffer in Folge → langsamerer Balken, brennender Ball.
- **Schwierigkeit:** Rookie / Pro / Legende.
- **Trophäenschrank & 12 Erfolge**, alles lokal im Browser gespeichert.
- **Sound** per Web Audio API (keine Audiodateien), Vibration auf dem Handy.
- **PWA:** installierbar, offline spielbar (Service Worker).

## Technik
- Reines HTML/CSS/JavaScript, kein Build-Schritt, keine Abhängigkeiten.
- Selbst gehostete Schriften, keine Drittanbieter → strenge Content-Security-Policy, keine Cookies.
- Barrierefreiheit: Tastatur (Leertaste/Enter zum Werfen), Fokus-Stile, `aria-live`-Kommentar, `prefers-reduced-motion`.

```
index.html, 404.html, datenschutz.html
css/main.css
js/physics.js   Wurf-Physik (auch in Node testbar)
js/data.js      Clubs, Texte, Erfolge
js/game.js      Spiel-Engine (Finale + Contest, Canvas)
js/card.js      Transfer & Spielerkarte
js/store.js     Speicherstand & Erfolge
js/audio.js     Synth-Sounds
js/fx.js        Konfetti, Toasts
js/main.js      Verdrahtung, PWA
sw.js, manifest.webmanifest, icons/, fonts/, og.png
nginx.conf, Dockerfile
tests/          node:test (Physik-Balance, Daten, Seiten-Integrität)
tools/          Generator für Icons & Vorschaubild (Python/Pillow)
```

## Entwicklung
```bash
npm test          # Tests (Node ≥ 20)
npm run serve     # lokal unter http://localhost:8080
```
`index.html` kann auch direkt per Doppelklick geöffnet werden (dann ohne Offline-Modus).
Mit `?debug` in der URL ist `FYGame.debug` für Tests verfügbar.

## Deployment
Coolify baut das `Dockerfile` (nginx, Port 80, Healthcheck `/healthz`).
Bei Änderungen an ausgelieferten Dateien die `VERSION` in `sw.js` erhöhen.
