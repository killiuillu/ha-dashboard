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
npm run build        # baut dist/ha-dashboard.js (esbuild)
npm run dev          # Watch-Build + Dev-Server: http://127.0.0.1:8123/dev/
```

Die Dev-Seite (`dev/index.html`) lädt das Bundle mit einem Mock-`hass` (Fixture
`dev/fixture.json`, Entities `sensor.evcc_*`) und zeigt die Token-Übersicht sowie alle
registrierten `custom:evcc-*`-Karten.

## Installation in Home Assistant

### Über den Marketplace (HACS) – empfohlen
Ab HA 2026.11 ist HACS direkt als **Marketplace** eingebaut, davor als HACS-Integration.

1. Marketplace/HACS öffnen → ⋮ (oben rechts) → **Benutzerdefinierte Repositories**
2. URL `https://github.com/killiuillu/ha-dashboard` eintragen, Kategorie **Dashboard** wählen → Hinzufügen
3. „evcc Dashboard“ installieren (lädt das Release-Asset `ha-dashboard.js`)
4. HACS fügt die Lovelace-Ressource automatisch hinzu: `/hacsfiles/ha-dashboard/ha-dashboard.js?hacstag=…`
5. Browser-Tab neu laden – die Karten erscheinen im Karten-Picker, die Strategie im „Dashboard hinzufügen“-Dialog (ab HA 2026.5 unter *Community-Dashboards*)

### Manuell (ohne HACS)
1. `dist/ha-dashboard.js` aus einem [Release](https://github.com/killiuillu/ha-dashboard/releases) laden (oder lokal `npm ci && npm run build`)
2. Datei nach `config/www/evcc-dashboard/ha-dashboard.js` kopieren (`/local/` = `config/www/`)
3. **Einstellungen → Dashboards → ⋮ → Ressourcen → Ressource hinzufügen:** URL `/local/evcc-dashboard/ha-dashboard.js?v=0.1.0`, Typ **JavaScript-Modul**
4. Browser-Tab neu laden (YAML-Modus stattdessen: `lovelace: resources: - url: /local/evcc-dashboard/ha-dashboard.js type: module`, dann `lovelace.reload_resources` oder Neustart)

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
| `custom:evcc-vehicle-card` | Auto-Bild mit Ladestand (SoC) und Reichweite | gebaut (M8) |

Fahrzeug-Karte – Bild optional, Reichweite als Entity oder berechnet (`capacity_kwh`):

```yaml
type: custom:evcc-vehicle-card
title: Mein Auto
image: /local/evcc/auto.png        # optional, sonst mdi:car-electric
capacity_kwh: 60                   # optional, Fallback: Reichweite = SoC × Kapazität
entities:
  vehicle_soc: sensor.evcc_loadpoint_1_vehicle_soc
  range: sensor.evcc_loadpoint_1_vehicle_range   # optional (km)
  charge_power: sensor.evcc_loadpoint_1_charge_power
  status: sensor.evcc_loadpoint_1_status
```

Alle Entities werden in der Card-Config gesetzt, siehe Beispiele in [PLAN.md](PLAN.md).

## Dashboard-Strategie (M6)

Das ganze Dashboard automatisch aus den evcc-Entities aufbauen lassen:

```yaml
title: evcc
strategy:
  type: custom:evcc
  prefix: evcc          # optional, Default "evcc"
  modules:              # optional – ohne Angabe werden ALLE erkannten Module angezeigt
    - evcc
    - raumklima
    - hue
    - kalender
    - mülltonnen
```

`ll-strategy-dashboard-evcc` erkennt `sensor.<prefix>_*` (PV/Netz/Haus/Batterie, Tageswerte, Preis,
`loadpoint_<n>_*`) und erzeugt die Views **Übersicht** und **Verlauf** (Tagesverlauf). Reine Anzeige.

**Module (M10):** ohne `modules:` werden automatisch alle vorhandenen erkannt und eingebaut:
- **evcc** – unsere Karten (Übersicht, Ladepunkt, Fahrzeug, Energie & Kosten, Verlauf)
- **raumklima** – `climate.*` mit Platform `raumklima` (Karten von Raumklima 2, falls installiert, sonst Entity-Liste)
- **hue** – Lichter der Hue-Integration (Fallback: alle `light.*`), max. 12
- **kalender** – bis zu 5 `calendar.*` als Kalender-Karte
- **mülltonnen** – Sensoren der Integration `waste_collection_schedule` (oder IDs mit waste/muell/tonne), max. 10

Aliase wie `Mülltonnen`, `kalender`, `Lichter` funktionieren ebenfalls. Zum Auswählen beim Anlegen einfach
`modules:` in der Strategy-Config setzen.
