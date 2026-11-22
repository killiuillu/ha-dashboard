import { LitElement, css, html, nothing } from "lit";
import { t } from "../i18n/index.js";
import { MODULES, detectModules } from "./strategy.js";

const MODULE_META = {
  evcc: { icon: "mdi:solar-power", label: "evcc" },
  raumklima: { icon: "mdi:home-thermometer", label: "Raumklima" },
  hue: { icon: "mdi:lightbulb", label: "Hue" },
  calendar: { icon: "mdi:calendar", label: "Kalender" },
  muell: { icon: "mdi:trash-can", label: "Müllabfuhr" },
};

export class EvccStrategyEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
  };

  setConfig(config) {
    this.config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) this._det = detectModules(hass, this.config?.prefix || "evcc");
  }

  get _selected() {
    const m = this.config?.modules;
    if (Array.isArray(m) && m.length) return new Set(m);
    const det = this._det || {};
    return new Set(MODULES.filter((k) => k === "evcc" ? det.evcc && Object.values(det.evcc).some((v) => typeof v === "string") || (det.evcc && det.evcc.loadpoints.length) : (det[k] || []).length));
  }

  _fire(patch) {
    const config = { ...this.config, ...patch };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  _toggle(key, on) {
    const sel = new Set(this._selected);
    if (on) sel.add(key);
    else sel.delete(key);
    this._fire({ modules: MODULES.filter((m) => sel.has(m)) });
  }

  _available(key) {
    const det = this._det || {};
    if (key === "evcc") return !!(det.evcc && (Object.values(det.evcc).some((v) => typeof v === "string") || det.evcc.loadpoints?.length));
    return !!(det[key] && det[key].length);
  }

  render() {
    const cfg = this.config || {};
    return html`
      <div class="ed">
        <div class="hint">${t("Wählt die Module fürs Dashboard")}</div>
        ${MODULES.map((key) => {
          const meta = MODULE_META[key];
          const on = this._selected.has(key);
          const avail = this._available(key);
          return html`
            <label class="mod${on ? " on" : ""} ${avail ? "" : " off"}">
              <input type="checkbox" .checked=${on} @change=${(ev) => this._toggle(key, ev.target.checked)} />
              <ha-icon icon="${meta.icon}"></ha-icon>
              <span>${meta.label}</span>
              ${avail ? nothing : html`<small>${t("nicht erkannt")}</small>`}
            </label>
          `;
        })}
        <label class="fld">
          <span>${t("Titel")}</span>
          <input type="text" .value=${cfg.title || ""} placeholder="evcc Dashboard" @input=${(ev) => this._fire({ title: ev.target.value || undefined })} />
        </label>
        <label class="fld">
          <span>${t("Entity-Präfix")}</span>
          <input type="text" .value=${cfg.prefix || ""} placeholder="evcc" @input=${(ev) => this._fire({ prefix: ev.target.value || undefined })} />
        </label>
      </div>
    `;
  }

  static styles = css`
    .ed { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
    .hint { font-size: .9rem; color: var(--secondary-text-color, #727272); }
    .mod {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--primary-text-color, #212121) 5%, transparent);
      cursor: pointer;
      font-weight: 600;
    }
    .mod.on { background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent); }
    .mod.off { opacity: .55; }
    .mod ha-icon { --mdc-icon-size: 22px; }
    .mod small { margin-left: auto; font-weight: 400; color: var(--secondary-text-color, #727272); }
    .fld { display: flex; align-items: center; gap: 10px; font-size: .9rem; }
    .fld span { width: 110px; color: var(--secondary-text-color, #727272); }
    .fld input {
      flex: 1;
      font: inherit;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--primary-text-color, #212121) 18%, transparent);
      background: transparent;
      color: var(--primary-text-color, #212121);
    }
  `;
}
