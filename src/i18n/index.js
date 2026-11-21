import { EN } from "./en.js";

const TABLES = { en: EN };

let lang = "de";
let locale = "de-DE";

export function setLang(hass) {
  const nav = typeof navigator !== "undefined" && navigator.language ? navigator.language : "de";
  const l = String((hass && ((hass.locale && hass.locale.language) || hass.language)) || nav || "de");
  const low = l.toLowerCase();
  lang = low.startsWith("de") ? "de" : "en";
  locale = lang === "de" ? "de-DE" : "en-GB";
}

export const getLang = () => lang;
export const loc = () => locale;

export function t(de, vars) {
  let s = lang === "de" ? de : TABLES[lang][de] ?? EN[de] ?? de;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

export function tmap(obj) {
  return new Proxy(obj, {
    get(target, key) {
      const v = target[key];
      if (typeof v === "string") return t(v);
      if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? t(x) : x));
      if (v && typeof v === "object") return tmap(v);
      return v;
    },
  });
}
