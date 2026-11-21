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

## Karten (ab M3)

| Typ | Inhalt |
| --- | --- |
| `custom:evcc-overview-card` | Übersicht PV / Netz / Haus / Batterie mit Ampel |
| `custom:evcc-loadpoint-card` | Ladepunkt(e): Ladeleistung, Fahrzeug-SoC, Status |
| `custom:evcc-history-card` | Tagesverlauf als Chart mit Tooltip |
| `custom:evcc-energy-card` | Energie & Kosten (inkl. Preis aus dem HA-Energy-Dashboard) |

Alle Entities werden in der Card-Config gesetzt, siehe Beispiel in [PLAN.md](PLAN.md).
