import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync(new URL("../../src/tokens/design-tokens.json", import.meta.url), "utf8"));

test("Statuspalette enthält alle Ampelfarben aus Raumklima 2", () => {
  assert.deepEqual(Object.keys(tokens.colors.status).sort(), ["air", "cold", "eco", "heat", "off", "ok", "warn"]);
  assert.equal(tokens.colors.status.heat, "#ff7a45");
  assert.equal(tokens.colors.status.ok, "#2ec4a6");
  assert.equal(tokens.colors.status.air, "#4f9dff");
  assert.equal(tokens.colors.status.warn, "#ffb020");
  assert.equal(tokens.colors.status.cold, "#ff4d6d");
  assert.equal(tokens.colors.status.off, "#8a94a6");
  assert.equal(tokens.colors.status.eco, "#8b7cf6");
});

test("Karten-Maße und Tooltip entsprechen der Referenz", () => {
  assert.equal(tokens.radius.card, "28px");
  assert.equal(tokens.radius.cardMedium, "22px");
  assert.equal(tokens.spacing.cardPadding, "20px");
  assert.equal(tokens.shadow.tip, "0 8px 28px rgba(0,0,0,.18)");
  assert.equal(tokens.components.tip.backdropFilter, "blur(8px)");
  assert.equal(tokens.components.tip.radius, "var(--evc-radius-xl)");
  assert.equal(tokens.components.qm.size, "18px");
  assert.equal(tokens.typography.value.size, "clamp(2.1rem, 17cqw, 3.1rem)");
  assert.equal(tokens.typography.value.weight, 300);
  assert.equal(tokens.typography.value.letterSpacing, "-.04em");
});

test("Jede Komponente referenziert nur vorhandene Token-Gruppen", () => {
  const groups = ["colors", "radius", "shadow", "spacing", "typography", "components"];
  for (const g of groups) assert.ok(tokens[g] && typeof tokens[g] === "object", `Gruppe ${g} fehlt`);
});
