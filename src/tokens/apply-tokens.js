import tokens from "./design-tokens.json";

export { tokens };

export function tokensToCssVars() {
  const vars = {};
  const add = (name, value) => {
    vars[`--evc-${name}`] = value;
  };
  for (const [k, v] of Object.entries(tokens.colors.status)) add(`color-status-${k}`, v);
  for (const [k, v] of Object.entries(tokens.colors.ha)) add(`color-ha-${k}`, v);
  for (const [k, v] of Object.entries(tokens.colors.tint)) add(`color-tint-${k}`, v);
  for (const [k, v] of Object.entries(tokens.radius)) add(`radius-${k}`, v);
  for (const [k, v] of Object.entries(tokens.shadow)) add(`shadow-${k}`, v);
  for (const [k, v] of Object.entries(tokens.spacing)) add(`spacing-${k}`, v);
  return vars;
}

export function applyTokens(doc = document) {
  if (doc.getElementById("evcc-design-tokens")) return;
  const style = doc.createElement("style");
  style.id = "evcc-design-tokens";
  const body = Object.entries(tokensToCssVars())
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  style.textContent = `:root{${body}}`;
  doc.head.appendChild(style);
}

export const toneVar = (tone) => `var(--evc-color-status-${tone || "off"})`;
