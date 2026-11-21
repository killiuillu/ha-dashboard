export const stateOf = (hass, id) => (id && hass && hass.states ? hass.states[id] : undefined);

export const unitOf = (hass, id) => stateOf(hass, id)?.attributes?.unit_of_measurement || "W";

export function collectIds(entities) {
  const out = [];
  for (const v of Object.values(entities || {})) {
    if (Array.isArray(v)) for (const x of v) out.push(...(typeof x === "object" && x !== null ? Object.values(x) : [x]));
    else out.push(v);
  }
  return out.filter(Boolean);
}

export function sig(hass, ids) {
  return ids
    .map((id) => {
      const s = stateOf(hass, id);
      return s ? `${id}|${s.state}|${s.last_changed}` : `${id}|-`;
    })
    .join(";");
}

export function changed(host, hass, ids) {
  const s = sig(hass, ids);
  if (host.__evcSig === s) return false;
  host.__evcSig = s;
  return true;
}
