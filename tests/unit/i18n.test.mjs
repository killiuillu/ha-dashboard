import { test } from "node:test";
import assert from "node:assert/strict";
import { getLang, setLang, t, tmap } from "../../src/i18n/index.js";
import { STATUS, statusOf } from "../../src/status.js";

test("Deutsch ist Standard und bleibt unverändert", () => {
  setLang({ language: "de" });
  assert.equal(getLang(), "de");
  assert.equal(t("PV"), "PV");
  assert.equal(t("{n} Ladepunkte", { n: 2 }), "2 Ladepunkte");
});

test("Englisch wird über die Tabelle übersetzt, Unbekanntes fällt auf Deutsch zurück", () => {
  setLang({ locale: { language: "en" } });
  assert.equal(getLang(), "en");
  assert.equal(t("PV"), "Solar");
  assert.equal(t("Netzbezug"), "Grid import");
  assert.equal(t("etwas ohne Übersetzung"), "etwas ohne Übersetzung");
  setLang({ language: "de" });
});

test("tmap übersetzt verschachtelte Status-Objekte", () => {
  setLang({ language: "en" });
  assert.equal(STATUS.charging.label, "Vehicle charging");
  assert.equal(STATUS.charging.tone, "heat");
  setLang({ language: "de" });
  assert.equal(statusOf("charging").label, "Fahrzeug lädt");
  assert.equal(statusOf("unbekannt").label, "Aus");
});
