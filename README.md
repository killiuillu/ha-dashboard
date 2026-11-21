# ha-dashboard

Custom-Lovelace-Cards und Dashboard-Strategie für **evcc** im visuellen Stil der Integration
[Raumklima 2](https://github.com/Goldi5/Raumklima-2): Kacheln, große Messwerte, Ampelfarben,
„?“-Erklärungen – **nur Anzeige, nichts wird gesteuert**.

Der Plan mit Ordnerstruktur und Meilensteinen steht in [PLAN.md](PLAN.md).
Design-Tokens (Farben, Radien, Schatten, Typografie, Tooltip) liegen zentral in
`src/tokens/design-tokens.json` und werden als CSS-Variablen (`--evc-*`) auf `:root` gesetzt.

## Quickstart (Entwicklung)

```bash
npm install
npm run build        # baut dist/evcc-dashboard.js (esbuild)
npm run dev          # Watch-Build + Dev-Server: http://127.0.0.1:8123/dev/
```

Die Dev-Seite (`dev/index.html`) lädt das Bundle mit einem Mock-`hass` (Fixture
`dev/fixture.json`, Entities `sensor.evcc_*`) und zeigt die Token-Übersicht sowie alle
registrierten `custom:evcc-*`-Karten. In Home Assistant wird das Bundle als
Lovelace-Ressource eingebunden (`/evcc-dashboard/dist/evcc-dashboard.js`).

## Tests

```bash
npm run test:unit    # node --test: i18n, Formatierung, Token-Integrität
npx playwright install chromium
npm test             # E2E: Rendern der Karten mit Fixture im Chromium, Konsolenfehler prüfen
```

## Karten

| Typ | Inhalt | Status |
| --- | --- | --- |
| `custom:evcc-overview-card` | Übersicht PV / Netz / Haus / Batterie mit Ampel und „?“-Erklärung | gebaut (M3) |
| `custom:evcc-loadpoint-card` | Ladepunkt(e): Ladeleistung, Fahrzeug-SoC als Ring, Status | gebaut (M4) |
| `custom:evcc-history-card` | Tagesverlauf PV/Netz/Haus als Chart mit Tooltip (Recorder-Statistiken) | gebaut (M5) |
| `custom:evcc-energy-card` | Autarkie, Energie & Kosten heute (inkl. Preis aus dem HA-Energy-Dashboard) | gebaut (M5) |

Alle Entities werden in der Card-Config gesetzt, siehe Beispiele in [PLAN.md](PLAN.md).

## Dashboard-Strategie (M6)

Das ganze Dashboard automatisch aus den evcc-Entities aufbauen lassen:

```yaml
title: evcc
strategy:
  type: evcc
  prefix: evcc   # optional, Default "evcc"
```

`ll-strategy-dashboard-evcc` erkennt `sensor.<prefix>_*` (PV/Netz/Haus/Batterie, Tageswerte, Preis,
`loadpoint_<n>_*`) und erzeugt die Views **Übersicht** (Übersichtskarte, Ladepunkt-Karte, Energie &
Kosten) und **Verlauf** (Tagesverlauf). Reine Anzeige.
