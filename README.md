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
| `custom:evcc-loadpoint-card` | Ladepunkt(e): Ladeleistung, Fahrzeug-SoC als Ring, Status; optional steuerbar: `control: true` + `charge_mode` → Knöpfe **Aus/Schnell/Smart** | gebaut (M4), Ladesteuerung (M27) |
| `custom:evcc-history-card` | Tagesverlauf PV/Netz/Haus als Chart mit Tooltip (Recorder-Statistiken) | gebaut (M5) |
| `custom:evcc-energy-card` | Autarkie, Energie & Kosten heute (inkl. Preis aus dem HA-Energy-Dashboard) | gebaut (M5) |
| `custom:evcc-vehicle-card` | Auto-Bild mit Ladestand (SoC) und Reichweite | gebaut (M8) |
| `custom:modular-calendar-card` | Termine gewählter Kalender als **Liste** oder **Monatsansicht** (`view: list|calendar`) | gebaut (M13) |
| `custom:modular-waste-card` | Nächste Abholungen je Tonne – Zahl = **Tage bis Abholung**, nächster Termin hervorgehoben | gebaut (M13) |
| `custom:modular-lights-card` | Lichter im Raumklima-Stil: Status-Chip (an/aus), Helligkeit als Balken, Farbe – nur Anzeige | gebaut (M16) |
| `custom:modular-rooms-card` | Raum-Übersicht (Temp + Licht-Indikator), Klick öffnet Raum-Steuerung | gebaut (v1.0.0) |
| `custom:modular-ticker-card` | Ereignis-Laufband (Termine, Müll, Pakete) | gebaut (v1.0.0) |

Fahrzeug-Karte – Bild optional, Reichweite als Entity oder berechnet (`capacity_kwh`):

Ladepunkt-Karte – optional mit Lademodus-Steuerung (`control: true`, Default read-only; Modus-Select wird automatisch erkannt oder per `charge_mode` gesetzt):

```yaml
type: custom:evcc-loadpoint-card
title: Wallbox
control: true                 # optional – Knöpfe Aus/Schnell/Smart (select.select_option), Default: nur Anzeige
entities:
  loadpoints:
    - name: LP 1
      charge_power: sensor.evcc_loadpoint_1_charge_power
      vehicle_soc: sensor.evcc_loadpoint_1_vehicle_soc
      status: sensor.evcc_loadpoint_1_status
      charge_mode: select.evcc_loadpoint_1_charge_mode   # optional, Auto-Erkennung: select.<prefix>_loadpoint_<n>_charge_mode
```

```yaml
type: custom:evcc-vehicle-card
title: Mein Auto
image: /local/evcc/auto.png        # optional, sonst mdi:car-electric (im Setup-Dialog: Feld „Auto-Bild (Pfad)“)
capacity_kwh: 60                   # optional, Fallback: Reichweite = SoC × Kapazität
entities:
  vehicle_soc: sensor.evcc_loadpoint_1_vehicle_soc
  range: sensor.evcc_loadpoint_1_vehicle_range   # optional (km)
  charge_power: sensor.evcc_loadpoint_1_charge_power
  status: sensor.evcc_loadpoint_1_status
```

Hinweis (M28): Die evcc-Kacheln (Übersicht, Ladepunkt, Fahrzeug, Energie & Kosten) stehen im modularen Dashboard **nebeneinander in einer Zeile** und füllen die Breite automatisch (4 Kacheln = je ⅓ der Abschnittsbreite). Ladesteuerung: `charge_control: true` in der Strategie bzw. Checkbox „Ladesteuerung“ im Dialog (Default: read-only).

Kalender- und Mülltonnen-Karte (M13):

```yaml
type: custom:modular-calendar-card
title: Kalender
view: list            # list (Default) oder calendar (Monatsansicht)
days: 14              # optional, Lookahead der Listenansicht in Tagen
group: true           # optional – eigene Liste pro Kalender (mit Kopfzeile + Farbe)
max: 5                # optional – max. Listeneinträge (gesamt bzw. je Kalender bei group)
entities:
  - calendar.familie
  - calendar.arbeit
  # oder mit eigenem Namen/Farbe/max (max = Einträge nur für diesen Kalender):
  # - entity: calendar.geburtstage
  #   name: Geburtstage
  #   color: "#ff4d6d"
  #   max: 3
```

```yaml
type: custom:modular-waste-card
title: Mülltonnen
entities:
  - sensor.waste_collection_schedule_restmuell
  - sensor.waste_collection_schedule_bio
  # oder mit eigenem Namen/Icon/Farbe:
  # - entity: sensor.waste_collection_schedule_papier
  #   name: Papier
  #   icon: mdi:package-variant-closed
  #   color: "#4f9dff"
```

```yaml
type: custom:modular-lights-card
title: Lichter
control: true         # optional – Klick schaltet an/aus (light.turn_on/turn_off); Default: read-only
entities:
  - light.wohnzimmer
  # oder mit eigenem Namen/Icon/Farbe:
  # - entity: light.kueche
  #   name: Küche
  #   icon: mdi:lamp
  #   color: "#ffb020"
```

Die Lichter-Karte sortiert „an“ zuerst, zeigt pro Licht Status-Chip (an = warm/amber, aus = grau),
Helligkeit als Balken (aus `brightness`/`brightness_pct`) und optional eigene Farbe. Default reine
Anzeige; mit `control: true` (auch im Setup-Dialog: „Lichter steuerbar“) schaltet ein Klick die Lampe
an/aus (`light.turn_on`/`light.turn_off`).

Die Mülltonnen-Karte liest die Sensoren der Integration `waste_collection_schedule` (State = Tage bis
Abholung bzw. Datum, alternativ `daysTo`/`next_date`/`next_collection`-Attribute), sortiert aufsteigend
und hebt den nächsten Termin hervor. Die große Zahl pro Zeile ist immer **„Tage bis zur nächsten
Abholung“** (0 = Heute, 1 = Morgen) – zusätzlich steht das Abholdatum dabei. Reine Anzeige.

Alle Entities werden in der Card-Config gesetzt, siehe Beispiele in [PLAN.md](PLAN.md).

## Hauptdashboard für Tablet (v1.0.0, M18)

Separate Strategie `custom:main` (**„Hauptdashboard (Tablet)“** im Dialog „Dashboard hinzufügen“,
eigener Konfigurator mit Titel/Präfix/Auto-Bild/Ticker/Räume-steuerbar):

- **Oben:** `custom:modular-rooms-card` – kompakte Übersicht aller HA-Räume (Area) mit Temperatur
  und Licht-Indikator (Punkt amber = Licht an). **Klick auf einen Raum** öffnet ein **Popup** mit der Steuerung:
  Lichter (`custom:modular-lights-card` mit `control: true`), Klima (`hui-climate-card`),
  Media Player (`hui-media-control-card`), weitere Entities – in HA direkt bedienbar.
- **Mitte:** kompakte evcc-Zeile – Übersicht, Ladepunkt, Fahrzeug/Reichweite und Energie & Kosten **nebeneinander** (je ¼ Breite, eine Zeile; M27).
- **Darunter:** eine Kalender-Kachel **pro Kalender** nebeneinander, die Reihe füllt die volle Breite (Default „Automatisch“; 4 Kalender = 4 pro Zeile, 2 Kalender = 2×½; je `view: list`, `max: 5`). Anordnung über `calendar_columns:` bzw. Select im Dialog; Auswahl über `calendars:` bzw. Checkboxen im Dialog.
- **Ganz unten:** `custom:modular-ticker-card` – Laufband (links→rechts, pausiert bei Hover) mit
  Terminen heute/morgen, Müll bald fällig (`days <= 2`) und erwarteten Paketen. Paket-Sensoren werden an
  der Entity-ID erkannt (DHL, GLS, Hermes, DPD, UPS, Amazon, FedEx bzw. paket/package/lieferung/delivery) und
  erscheinen **nur, wenn wirklich Pakete kommen** (State eine Zahl > 0 bzw. ein Status ungleich
  0/keine/unavailable/geliefert; alternativ Anzahl über Attribute wie `expected_count` oder eine
  Tracking-Liste). Im Laufband steht Carrier + Anzahl/Status, z. B. „DHL: 2 Pakete (erwartet
  2026-11-24)“. Reine Anzeige.
- Tablet-optimiert: View mit `max_columns: 4`, Karten über `grid_options.columns` verteilt.

```yaml
strategy:
  type: custom:main
  prefix: evcc
  ticker: true          # Ereignis-Ticker unten (Default: an)
  rooms_control: true   # Räume per Klick steuerbar (Default: an)
  charge_control: true   # optional – Lademodus-Knöpfe (Aus/Schnell/Smart) an der Ladepunkt-Karte (Default: read-only; Dialog: Checkbox „Ladesteuerung“)
  rooms: [wohnzimmer, kueche]   # optional – nur diese Räume anzeigen (Default: alle; Dialog: Checkboxen)
  calendar_columns: auto   # auto = volle Breite, Kacheln nebeneinander je nach Anzahl (Default, z. B. 4 Kalender = 4 pro Zeile à ¼); 12 = 4 pro Zeile, 24 = 2 pro Zeile, "full" = vollbreit gestapelt
  calendars: [calendar.familie, calendar.arbeit]   # optional – nur diese Kalender-Kacheln (Default: alle erkannten, max. 4; Dialog: Checkboxen „Kalender auswählen“)
```

## Dashboard-Strategie (M6)

Das ganze Dashboard automatisch aus den evcc-Entities aufbauen lassen:

```yaml
title: Mein Zuhause
strategy:
  type: custom:modular
  prefix: evcc          # optional, Default "evcc"
  image: /local/evcc/auto.png   # optional, Auto-Bild für die Fahrzeug-Karte (Dialog: „Auto-Bild (Pfad)“)
  modules:              # optional – ohne Angabe werden ALLE erkannten Module angezeigt
    - evcc
    - raumklima
    - hue
    - kalender
    - mülltonnen
  calendar:             # optional – welche Kalender + welche Ansicht (Default: alle erkannten, Liste)
    entities: [calendar.familie, calendar.arbeit]   # oder Objekte: { entity, name, color, max }
    view: list          # list oder calendar (Monatsansicht)
    days: 14            # optional, Lookahead der Listenansicht
    group: true         # optional, Listenansicht gruppiert je Kalender
    max: 5              # optional, max. Listeneinträge
  hue:                  # optional – welche Lichter (Default: alle erkannten Hue-Lichter)
    entities: [light.wohnzimmer, light.kueche]
    control: true       # optional – Lichter per Klick an/aus schaltbar (Default: read-only)
  waste:                # optional – welche Tonnen (Default: alle erkannten)
    entities: [sensor.waste_collection_schedule_restmuell, sensor.waste_collection_schedule_bio]
```

Die Strategie `ll-strategy-dashboard-modular` (im UI-Dialog: **„Modulares Dashboard“**) erkennt
`sensor.<prefix>_*` (PV/Netz/Haus/Batterie, Tageswerte, Preis) und Ladepunkte automatisch – erkannt werden `sensor|select.<prefix>_<loadpoint>_(charge_power|vehicle_soc|status|range|vehicle_range|charge_mode|mode)` mit beliebigem Loadpoint-Slug (z. B. `sensor.evcc_wallbox_charge_power`, `select.evcc_wallbox_mode` aus ha-evcc; auch `loadpoint_<n>_` und ohne Slug `sensor.evcc_charge_power`). Manueller Override pro Strategie: `loadpoints: [{ name, charge_power, vehicle_soc, status, charge_mode }]` (Top-Level oder unter `evcc:`). Lademodus-Steuerung: `charge_control: true` bzw. Checkbox „Ladesteuerung“ (Karte: `control: true` + `charge_mode`).
**Übersicht** und **Verlauf** (Tagesverlauf). Reine Anzeige. Der alte Typ `custom:evcc`
(`ll-strategy-dashboard-evcc`) bleibt als Alias definiert – bestehende YAML-Dashboards laufen weiter.

**Module (M10):** ohne `modules:` werden automatisch alle vorhandenen erkannt und eingebaut:
- **evcc** – unsere Karten (Übersicht, Ladepunkt, Fahrzeug, Energie & Kosten, Verlauf)
- **raumklima** – `climate.*` mit Platform `raumklima` (Karten von Raumklima 2, falls installiert, sonst Entity-Liste)
- **hue** – Lichter der Hue-Integration (Fallback: alle `light.*`), max. 12, als eigene Karte `custom:modular-lights-card` (M16)
- **kalender** – bis zu 10 `calendar.*` als eigene Karte `custom:modular-calendar-card` (M13)
- **mülltonnen** – Sensoren der Integration `waste_collection_schedule` (oder IDs mit waste/muell/tonne bzw. Attributen `daysTo`/`next_date`/`next_collection`), max. 10, als eigene Karte `custom:modular-waste-card` (M13)

Aliase wie `Mülltonnen`, `kalender`, `Lichter` funktionieren ebenfalls.

**Ohne YAML – direkt beim Anlegen auswählen (M11):** Ab HA 2026.5 erscheint die Strategie im Dialog
**Dashboard hinzufügen → Community-Dashboards → „Modulares Dashboard“**. Weil der Eintrag
`configRequired: true` hat, öffnet HA automatisch den **Konfigurator** (`getConfigElement()`): Checkboxen
für die Module (nur die in deiner HA erkannten sind aktiv), dazu Titel und Entity-Präfix – beim Modul
**Kalender** zusätzlich welche Kalender und welche Ansicht (Liste/Kalenderansicht), beim Modul
**Mülltonnen** welche Tonnen angezeigt werden (M13). Erst nach
„Erstellen“ wird das Dashboard mit der gewählten Modul-Auswahl angelegt. Später änderbar über
Dashboard → ⋮ → „Bearbeiten“ (Editor). YAML (`modules:`) bleibt als Alternative bestehen.
