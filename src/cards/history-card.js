import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { unitOf } from "../util/hass.js";
import { fmtVal } from "../util/evcc.js";
import { CHART_H, CHART_W, PAD, hourLabel, niceTicks, scaleX, scaleY, seriesRange } from "../util/chart.js";

const SERIES = {
  pv_power: { label: "PV", tone: "ok" },
  grid_power: { label: "Netz", tone: "air" },
  battery_power: { label: "Batterie", tone: "heat" },
  home_power: { label: "Hausverbrauch", tone: "eco" },
};

export class EvccHistoryCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true }, _stats: { state: true }, _hover: { state: true }, _err: { state: true } };

  static getStubConfig() {
    return { title: t("Tagesverlauf") };
  }

  getCardSize() {
    return 4;
  }

  willUpdate(changedProps) {
    super.willUpdate(changedProps);
    if (changedProps.has("hass") && this.hass) this._load();
  }

  async _load() {
    const em = this.entityMap;
    const keys = Object.keys(SERIES).filter((k) => em[k]);
    if (!keys.length) return;
    const dayKey = new Date().toISOString().slice(0, 10);
    const sigKey = `${dayKey}|${keys.map((k) => em[k]).join(",")}`;
    if (this._loadedSig === sigKey && (this._stats || this._err)) return;
    this._loadedSig = sigKey;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    try {
      const res = await this.hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(),
        end_time: new Date().toISOString(),
        period: "5minute",
        types: ["mean"],
        statistic_ids: keys.map((k) => em[k]),
      });
      const series = keys
        .map((k) => ({
          key: k,
          label: t(SERIES[k].label),
          tone: SERIES[k].tone,
          unit: unitOf(this.hass, em[k]),
          points: (res[em[k]] || [])
            .map((p) => ({ t: p.start, v: p.mean ?? null }))
            .filter((p) => p.v !== null && isFinite(p.v)),
        }))
        .filter((s) => s.points.length);
      this._stats = series;
      this._err = null;
    } catch (e) {
      this._err = String(e);
      this._stats = null;
    }
  }

  _onMove(ev) {
    const series = this._stats || [];
    const n = Math.max(...series.map((s) => s.points.length), 0);
    if (!n) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const frac = (ev.clientX - rect.left) / rect.width;
    const i = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    this._hover = { i, x: (scaleX(i, n) / CHART_W) * 100 };
  }

  render() {
    const cfg = this._config || {};
    const em = this.entityMap;
    if (!Object.keys(em).length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const title = cfg.title || t("Tagesverlauf");
    const tone = toneVar("air");
    const series = this._stats || [];
    let body;
    if (this._err) {
      body = html`<div class="err">${this._err}</div>`;
    } else if (!series.length) {
      body = html`<div class="empty">${t("Lädt …")}</div>`;
    } else {
      const { min, max } = seriesRange(series);
      const { ticks, lo, hi } = niceTicks(min, max, 4);
      const n = Math.max(...series.map((s) => s.points.length));
      const xIdxs = [0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4));
      const hover = this._hover;
      body = html`
        <div class="chart" style="--h:240px" @mousemove=${(ev) => this._onMove(ev)} @mouseleave=${() => (this._hover = null)}>
          <svg viewBox="0 0 ${CHART_W} ${CHART_H}" preserveAspectRatio="none">
            ${ticks.map(
              (v) => html`
                <line x1="${PAD.l}" x2="${CHART_W - PAD.r}" y1="${scaleY(v, lo, hi)}" y2="${scaleY(v, lo, hi)}" class="gridline" vector-effect="non-scaling-stroke" />
              `,
            )}
            ${series.map(
              (s) => html`
                <path
                  d=${s.points.map((p, i) => `${i ? "L" : "M"}${scaleX(i, n).toFixed(1)} ${scaleY(p.v, lo, hi).toFixed(1)}`).join(" ")}
                  fill="none"
                  stroke="${toneVar(s.tone)}"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  vector-effect="non-scaling-stroke"
                />
              `,
            )}
            ${hover
              ? html`<line class="hover-line" x1="${scaleX(hover.i, n)}" x2="${scaleX(hover.i, n)}" y1="${PAD.t}" y2="${CHART_H - PAD.b}" vector-effect="non-scaling-stroke" />`
              : nothing}
          </svg>
          ${ticks.map((v) => html`<span class="ylabh" style="top:${(scaleY(v, lo, hi) / CHART_H) * 100}%">${fmtVal(v, series[0]?.unit)}</span>`)}
          ${xIdxs.map((i) => {
            const p = series.find((s) => s.points[i])?.points[i];
            return html`<span class="xlabh" style="left:${(scaleX(i, n) / CHART_W) * 100}%">${p ? hourLabel(p.t) : ""}</span>`;
          })}
          ${hover
            ? html`<div class="tip" style="left:${hover.x}%;transform:translateX(-50%)">
                <div class="t">${series.find((s) => s.points[hover.i]) ? hourLabel(series.find((s) => s.points[hover.i]).points[hover.i].t) : ""}</div>
                ${series.map((s) => {
                  const p = s.points[Math.min(hover.i, s.points.length - 1)];
                  return html`<div class="r"><span><i style="--c:${toneVar(s.tone)}"></i>${s.label}</span><b>${p ? fmtVal(p.v, s.unit) : "–"}</b></div>`;
                })}
              </div>`
            : nothing}
        </div>
        <div class="tleg">
          ${series.map((s) => html`<span><i style="--c:${toneVar(s.tone)}"></i>${s.label}</span>`)}
        </div>`;
    }
    return html`
      <ha-card style="--tone:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Verlauf von PV, Netz, Haus und Batterie über den heutigen Tag (Recorder-Statistiken, 5-Minuten-Mittel). Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        ${body}
      </ha-card>`;
  }
}
