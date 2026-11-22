export function detectAreas(hass) {
  const areas = hass?.areas || {};
  const entities = hass?.entities || {};
  const devices = hass?.devices || {};
  const states = hass?.states || {};
  const byArea = {};
  for (const [id, e] of Object.entries(entities)) {
    if (!e || typeof e !== "object") continue;
    const areaId = e.area_id || (e.device_id && devices[e.device_id] ? devices[e.device_id].area_id : null);
    if (!areaId) continue;
    (byArea[areaId] = byArea[areaId] || []).push(id);
  }
  return Object.entries(areas).map(([area_id, a]) => {
    const ids = byArea[area_id] || [];
    const lights = ids.filter((id) => id.startsWith("light."));
    const climates = ids.filter((id) => id.startsWith("climate."));
    const media = ids.filter((id) => id.startsWith("media_player."));
    const others = ids.filter((id) => !/^(light|climate|media_player)\./.test(id));
    const lightsOn = lights.filter((id) => states[id]?.state === "on").length;
    const temps = climates
      .map((id) => states[id]?.attributes?.current_temperature)
      .filter((v) => typeof v === "number" && !isNaN(v));
    const temp = temps.length ? temps.reduce((s, v) => s + v, 0) / temps.length : null;
    return {
      area_id,
      name: (a && a.name) || area_id,
      icon: (a && a.icon) || "mdi:home-outline",
      lights,
      climates,
      media,
      others,
      lightsOn,
      temp,
    };
  });
}

export const fmtTemp = (v, loc) =>
  v === null || v === undefined || isNaN(v) ? "–" : `${Number(v).toLocaleString(loc(), { maximumFractionDigits: 1 })}°`;
