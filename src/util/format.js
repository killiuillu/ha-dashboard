import { loc } from "../i18n/index.js";

export const fmt = (v, d = 1) =>
  v === null || v === undefined || v === "" || isNaN(v)
    ? "–"
    : Number(v).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtInt = (v) => fmt(v, 0);

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const num = (state) => {
  const v = state && state.state;
  if (v === null || v === undefined || v === "" || v === "unavailable" || v === "unknown") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};
