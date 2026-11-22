# PLAN – evcc-Dashboard im Stil von Raumklima 2

Eigene Lovelace-Dashboard-Strategie plus Custom Cards für evcc-Daten, optisch wie die
Karten von [Raumklima 2](https://github.com/Goldi5/Raumklima-2) (Kacheln, große Messwerte,
Ampelfarben, „?“-Erklärungen) – **reine Anzeige, keine Steuerung**.

## Referenz & Design-Tokens

- `reference/raumklima-2/` ist die geklonte Referenz (nur Lesezugriff, via `.gitignore` nicht im Release).
- Die Design-Tokens aus `reference/raumklima-2/frontend/src/styles.js` sind extrahiert in
  **`src/tokens/design-tokens.json`** (Quelle der Wahrheit):
  - Statusfarben (Ampel): `heat #ff7a45`, `ok #2ec4a6`, `air #4f9dff`, `warn #ffb020`,
    `cold #ff4d6d`, `off #8a94a6`, `eco #8b7cf6`
  - Karten: Radius `28px` (kompakt `22px`), Padding `20px`, radialer Farb-Glow oben rechts (320px, `--tone` bei 18% Deckkraft)
  - Radien-Skala 6–28px + `999px` (Pills) + `50%`, Schatten (Tooltip `0 8px 28px rgba(0,0,0,.18)`, …)
  - Typografie: großer Wert `clamp(2.1rem, 17cqw, 3.1rem)`, Gewicht 300, `letter-spacing -.04em`,
    `tabular-nums`; Einheit `.42em` hochgestellt; Namen `1.15rem/600`; Stat-Label `.72rem` uppercase
  - Tooltip (`.tip`): `blur(8px)`, halbtransparente Kartenfarbe, Radius 14px, farbige 8px-Punkte
  - „?“-Button (`.qm`): 18px-Kreis, wird bei aktiv `weiß auf --g`
  - Chart: Grid gestrichelt `3 5`, Linie `2.4px` rund, Achsen-Labels `10.5px`
- `src/tokens/apply-tokens.js` wandelt die JSON in zentrale CSS-Variablen (`--evc-*`) auf `:root` um;
  alle Karten speisen sich daraus (`src/styles/card-styles.js` ist das gemeinsame Lit-Stylesheet).
- Status→Ton-Mapping für evcc liegt in `src/status.js` (z. B. Netzbezug → `cold`, Einspeisung → `ok`, Laden → `heat`).

## Ordnerstruktur

```
├── PLAN.md                     dieser Plan
├── package.json                Scripts: build / watch / check / dev / test / test:unit
├── playwright.config.mjs       E2E-Tests gegen lokalen Dev-Server (127.0.0.1:8123)
├── scripts/
│   ├── build.mjs               esbuild: src/index.js → dist/ha-dashboard.js (iife, es2022)
│   ├── dev.mjs                 esbuild-Watch + Dev-Server
│   └── serve.mjs               statischer Server nur auf 127.0.0.1 (Dev/Test)
├── src/
│   ├── index.js                Einstieg: Tokens anwenden, Sprache setzen, Karten registrieren
│   ├── tokens/
│   │   ├── design-tokens.json  zentrale Design-Tokens (siehe oben)
│   │   └── apply-tokens.js     JSON → CSS-Variablen (:root)
│   ├── styles/card-styles.js   gemeinsames Lit-Stylesheet aus den Tokens (ha-card, chip, stat, tip, qm, dial, chart)
│   ├── cards/
│   │   ├── base-card.js        EvccBaseCard (LitElement): setConfig/hass, Änderungs-Erkennung, CardSize/GridOptions
│   │   ├── overview-card.js    M3: custom:evcc-overview-card
│   │   ├── loadpoint-card.js   M4: custom:evcc-loadpoint-card
│   │   ├── history-card.js     M5: custom:evcc-history-card
│   │   ├── energy-card.js      M5: custom:evcc-energy-card
│   │   └── strategy.js         M6: ll-strategy-dashboard-modular (Alias ll-strategy-dashboard-evcc)
│   ├── i18n/                   de als Schlüsselsprache (wie Raumklima), en.js als Tabelle; setLang folgt hass.locale
│   ├── status.js               evcc-Status → { label, icon, tone }
│   └── util/                   format.js (fmt/num/esc), hass.js (stateOf, Signatur-Vergleich)
├── dev/
│   ├── index.html              lokaler HA-Test: Mock-hass + Token-Übersicht + Karten-Container
│   └── fixture.json            Mock-evcc-Entities (sensor.evcc_*)
├── tests/
│   ├── unit/                   node --test (i18n, Formatierung, Token-Integrität)
│   ├── e2e/                    Playwright: Rendern mit Fixture, keine Konsolenfehler, Tokens/Ampel prüfen
│   └── helpers.mjs             Bundle + Fixture in Chromium laden, Fehler sammeln
├── dist/                       Build-Ausgabe (gitignored)
└── reference/                  Raumklima-2-Klon, nur Lesereferenz (gitignored)
```

## Tools

- **esbuild** (wie Raumklima 2): ein Bundle `dist/ha-dashboard.js`, `format: iife`, `target: es2022`
- **Lit** für die HA-Cards (`EvccBaseCard extends LitElement`; HA-Standard: `setConfig`, `hass`, `getCardSize`, `getGridOptions`, `getStubConfig`, Registrierung über `customElements` + `window.customCards`)
- **Dev-Setup**: lokales HA-Test-Dashboard unter `npm run dev` → http://127.0.0.1:8123/dev/ mit Mock-`hass` (Fixture), statt haf-lighthouse – so ist der Look ohne laufende HA-Instanz prüfbar
- **Playwright** (Chromium) für E2E-Tests je Karte, wie `frontend/test/render.mjs` in Raumklima 2: Bundle in echte Browser-Seite laden, `pageerror`/Konsolenfehler assertieren, gerendertes HTML/DOM prüfen
- **node --test** für Unit-Tests (i18n, Formatierung, Tokens)

## Datenquellen & Konfiguration (entitäts-agnostisch)

Alle Entities werden pro Karte in der YAML-Config übergeben, kein hartkodiertes `evcc_`-Präfix:

```yaml
type: custom:evcc-overview-card
title: evcc
entities:
  pv_power: sensor.evcc_pv_power        # W, positiv = Erzeugung
  grid_power: sensor.evcc_grid_power    # W, negativ = Einspeisung
  home_power: sensor.evcc_home_power    # W
  battery_soc: sensor.evcc_battery_soc  # %
  battery_power: sensor.evcc_battery_power # W, positiv = lädt
```

Ladepunkt-Karte – ein Ladepunkt flach oder mehrere als Liste:

```yaml
type: custom:evcc-loadpoint-card
title: Wallbox
entities:
  charge_power: sensor.evcc_loadpoint_1_charge_power  # W
  vehicle_soc: sensor.evcc_loadpoint_1_vehicle_soc    # %
  status: sensor.evcc_loadpoint_1_status              # evcc: A/B/C/F oder paused
```

```yaml
type: custom:evcc-loadpoint-card
title: Wallboxen
entities:
  loadpoints:
    - name: Wallbox 1
      charge_power: sensor.evcc_loadpoint_1_charge_power
      vehicle_soc: sensor.evcc_loadpoint_1_vehicle_soc
      status: sensor.evcc_loadpoint_1_status
    - name: Wallbox 2
      charge_power: sensor.evcc_loadpoint_2_charge_power
```

Energie/Kosten-Karte liest optional `entities.price` (Strompreis) und die Tageszähler; Preise aus dem
HA-Energy-Dashboard werden angezeigt, wenn als Entity konfiguriert.

Dashboard-Strategie (M6):

```yaml
title: Mein Zuhause
strategy:
  type: custom:modular   # Legacy-Alias: custom:evcc
  prefix: evcc   # optional, Default "evcc"
```

`ll-strategy-dashboard-modular` erkennt die Entities am Präfix (`sensor.<prefix>_pv_power`, `_grid_power`,
`_home_power`, `_battery_soc`, `_battery_power`, `_<x>_today`, `_price`, `_loadpoint_<n>_*`) und baut
„Übersicht" (Overview-, Ladepunkt-, Energie-Karte) sowie „Verlauf" (History) automatisch auf.

## HACS/Marketplace-Verpackung (M7)

- `hacs.json` im Repo-Root; Build-Artefakt heißt wie das Repo: `dist/ha-dashboard.js` (HACS sucht für
  Dashboard-Plugins nach `dist/<repo-name>.js` bzw. im neuesten Release)
- `.github/workflows/release.yml`: bei Tag `v*` baut CI das Bundle und hängt `ha-dashboard.js` +
  `ha-dashboard.js.gz` an das GitHub-Release (HACS lädt von dort, Ressource `/hacsfiles/ha-dashboard/ha-dashboard.js`)
- Installation: HACS/Marketplace → benutzerdefiniertes Repository `https://github.com/killiuillu/ha-dashboard`,
  Kategorie **Dashboard**

## Meilensteine

- **M1 – Setup:** erledigt in PR #1 (Referenz klonen, Tokens extrahieren, PLAN.md, package.json, Build, Dev-Server, i18n-Grundgerüst, Testgerüst)
- **M2 – Dev-Setup grün:** erledigt in PR #1 (Build, Unit-Tests, Dev-Server, Playwright-Gerüst; CI-Workflow `.github/workflows/ci.yml`)
- **M3 – Karte 1 `custom:evcc-overview-card`:** erledigt in PR #2 (große Übersichtskachel PV/Netz/Haus/Batterie: Titel + „?“, Status-Chip, großer Live-Wert Netz, Stat-Kacheln, Ampelfarbe via `--tone`; Logik in `src/util/evcc.js`; Playwright-Test)
- **M4 – `custom:evcc-loadpoint-card`:** erledigt in PR #3 (Ladeleistung als großer Wert, Fahrzeug-SoC als Ring-Dial wie die Raumkarte, Status-Chip; ein Ladepunkt flach oder mehrere über `entities.loadpoints: [...]`; evcc-Statuscodes + Leistungs-Schwelle; Playwright-Test)
- **M5 – `custom:evcc-history-card` und `custom:evcc-energy-card`:** Verlaufskarte liest read-only Recorder-Statistiken (`recorder/statistics_during_period`, 5-Minuten-Mittel ab 00:00) über `hass.callWS` und zeichnet SVG-Linien mit Grid, Achsen-Labels und Hover-Tooltip im Raumklima-Stil (`src/util/chart.js`); Energie-Karte zeigt Autarkie groß + Tages-kWh (PV/Bezug/Einspeisung/Haus), Eigenverbrauch, Kosten (`entities.price`, optional `entities.feed_in_price`) und Strompreis; je Playwright-Test – erledigt in PR #4
- **M6 – Dashboard-Strategie `ll-strategy-dashboard-modular`:** erledigt in PR #5 (damals noch `…-evcc`); M12: Umbenennung auf `custom:modular` / „Modulares Dashboard“ (PR #12), `custom:evcc` bleibt als Alias (`static generate(config, hass)` wie die Referenz, Entity-Autoerkennung via Präfix in `detectEvcc`, Views „Übersicht" + „Verlauf", `window.customStrategies`; Unit- + Playwright-Tests)
- **M7 – HACS/Marketplace-Verpackung:** erledigt in PR #6/#7 (`hacs.json`, Release-Workflow liefert `hacs.json` + `ha-dashboard.js`(+`.gz`) als Assets, Artefakt heißt wie das Repo)
- **M8 – `custom:evcc-vehicle-card`:** erledigt in PR #8 (Fahrzeug-Karte mit Bild (`image:`, Fallback `mdi:car-electric`), großem SoC, Reichweite km (`entities.range` oder SoC × `capacity_kwh`); in der Strategie automatisch bei `vehicle_soc`)
- **M9 – Optik-Feinabgleich an Raumklima 2 (PR #9):** `rcard`-Akzentleiste oben (4px + Verlauf), Dial exakt wie Referenz (viewBox 240x200, R=100, 135°+270°, Strich 14, Doppel-Knopf, Skalenlabels), `.center` wie Referenz; SVG-Strokes über CSS-Klassen (var() in Präsentationsattributen rendert nicht); Screenshot-Vergleich in der CI (unsere Karten + Raumklima-Demo/-Raumkarte als Artifact `shots`, inkl. Pixel-Diagnose)
- **M10 – Modulare Dashboard-Strategie (PR #10):** `modules:` in der Strategy-Config (evcc/raumklima/hue/calendar/muell, Aliase wie „Mülltonnen“); Default = Auto-Erkennung aller Module (`detectModules`: raumklima über Platform `raumklima`, hue-Lichter, `calendar.*`, waste_collection_schedule-Sensoren); Raumklima-Modul nutzt `custom:raumklima-*`-Karten wenn registriert, sonst Entity-Liste
- **M11 – Konfigurator/Dialog statt YAML (PR #11):** `static getConfigElement()` liefert `evcc-strategy-editor` (Modul-Checkboxen mit Auto-Erkennung, Titel, Präfix; feuert `config-changed`), `getCreateSuggestions()` für Titel/Icon, `configRequired: true` in `customStrategies` → HA zeigt den Dialog vor dem Anlegen (ab HA 2026.5); E2E-Tests für Editor und Registrierung
- **M13 – Kalender- & Mülltonnen-Modul mit eigenen Karten:** `custom:modular-calendar-card` (Kalender-Auswahl, `view: list|calendar` mit Monatsgrid + Tagesauswahl, Events read-only über `hass.callApi` REST `calendars/<id>` mit `callWS`-Fallback, `src/util/calendar.js`) und `custom:modular-waste-card` (Tonnen-Auswahl, Sortierung nach Tagen, nächste Abholung hervorgehoben mit „als Nächstes“, Zahl = Tage bis Abholung inkl. „Heute“/„Morgen“, `src/util/waste.js`); Strategie baut beide Karten aus `config.calendar`/`config.waste` (Default: Auto-Erkennung); Editor erweitert um Kalender-Checkboxen, Ansicht-Umschalter und Tonnen-Checkboxen; Unit- + Playwright-Tests, Dev-Fixture mit `waste_collection_schedule`-Sensoren und Mock-Kalender-API (`dev/mock-api.mjs`)
- **M14 – Kalender-Listen gruppiert & begrenzbar:** `custom:modular-calendar-card` mit `group: true` (eigene Liste je Kalender inkl. Kopfzeile/Farbe/Zähler) und `max:` (Karten-Max, pro Kalender via `entities: [{entity, max}]` überschreibbar, Fallback Karten-Max) in `calendarListEntries` (`src/util/calendar.js`); Strategie reicht `calendar.group`/`calendar.max` durch; Editor ergänzt Gruppieren-Checkbox; M15: Auto-Bild (Pfad) als Feld im Setup-Dialog; M16: Hue-Modul als eigene Karte `custom:modular-lights-card` im Raumklima-Stil (Status-Chip an/aus mit Ampelfarbe, Helligkeits-Balken aus brightness/brightness_pct, Akzent-Leiste + Glow + ?-Hilfe, pro Licht name/icon/color konfigurierbar, `src/util/lights.js`), Auswahl der Lichter als Checkboxen im Editor (`hue: {entities}`), Strategie mappt hue/licht/lights; Unit- + E2E-Tests; M17: optionale Schaltfunktion für die Lichter-Karte (`control: true` -> Klick = light.turn_on/turn_off via callService, Default read-only), Checkbox „Lichter steuerbar“ im Editor, control-Passthrough in der Strategie, E2E mit callService-Mock; M18/v1.0.0: separates Hauptdashboard `custom:main` (ll-strategy-dashboard-main, eigenes Editor-Element main-strategy-editor, configRequired) – Tablet-Layout max_columns 4: Räume oben (custom:modular-rooms-card mit Temp/Licht-Indikator + Klick-Detail mit Lichter steuerbar + hui-climate/hui-media-control), evcc mittig, eine Kalender-Kachel pro Kalender nebeneinander (columns 3), Ereignis-Ticker unten (custom:modular-ticker-card: Termine heute/morgen + Müll <= Schwelle + Paket-Sensoren, CSS-Marquee) (`config.image` -> Fahrzeug-Karte `custom:evcc-vehicle-card`, Pfad z. B. `/local/evcc/auto.png` aus `config/www/`), globales Max-Feld und pro-Kalender-Max-Input; Unit- + E2E-Tests

## Randbedingungen

- UI-Texte Deutsch, i18n wie Raumklima (de als Schlüssel, `en.js`-Tabelle, `t()`/`tmap()`, Sprache folgt `hass.locale`)
- Nur Anzeige: kein `callService`, kein Schreibzugriff auf evcc/HA
- Kompatibel mit moderner HA-Version (Lovelace-Custom-Card-API: `customElements` + `window.customCards`) und modernen Browsern (ES2022, `color-mix`, Container Queries)
- Feature-Zweig `vibe/evcc-dashboard-0c1363`, Commits mit sprechenden deutschen Messages

## Offene Punkte (Platzhalter aus der Anfrage)

- Anzahl Ladepunkte und evcc-Entity-Präfix sind pro Karte konfigurierbar – Defaults in `dev/fixture.json` zeigen ein Beispiel mit einem Ladepunkt und `sensor.evcc_*`.
- Ziel-HA-Version: aktuelle stabile HA (2024.11+); Browser: neueste Chrome/Safari/Firefox.
