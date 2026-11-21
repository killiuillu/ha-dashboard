import { tmap } from "./i18n/index.js";

export const STATUS = tmap({
  solar_producing: { label: "PV erzeugt", icon: "mdi:solar-power", tone: "ok" },
  grid_import: { label: "Netzbezug", icon: "mdi:transmission-tower-import", tone: "cold" },
  grid_export: { label: "Einspeisung", icon: "mdi:transmission-tower-export", tone: "ok" },
  battery_charge: { label: "Batterie lädt", icon: "mdi:battery-charging", tone: "heat" },
  battery_discharge: { label: "Batterie entlädt", icon: "mdi:battery-arrow-down", tone: "air" },
  battery_idle: { label: "Batterie bereit", icon: "mdi:battery", tone: "off" },
  charging: { label: "Fahrzeug lädt", icon: "mdi:ev-station", tone: "heat" },
  vehicle_connected: { label: "Fahrzeug verbunden", icon: "mdi:ev-plug-type2", tone: "air" },
  paused: { label: "Pausiert", icon: "mdi:pause-circle", tone: "warn" },
  off: { label: "Aus", icon: "mdi:power", tone: "off" },
  unavailable: { label: "Nicht erreichbar", icon: "mdi:lan-disconnect", tone: "warn" },
});

export const statusOf = (key) => STATUS[key] || STATUS.off;
