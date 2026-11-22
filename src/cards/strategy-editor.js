import { LitElement, css, html, nothing } from "lit";
import { t } from "../i18n/index.js";
import { MODULES, detectModules, normalizeModules } from "./strategy.js";

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
    if (Array.isArray(m) && m.length) return new Set(normalizeModules(m));
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

  get _calCfg() {
    const c = this.config?.calendar;
    return c && typeof c === "object" && !Array.isArray(c) ? c : {};
  }

  get _calItems() {
    const e = this._calCfg.entities;
    return Array.isArray(e) && e.length ? e : (this._det?.calendar || []).map((id) => id);
  }

  get _calSelected() {
    return new Set(this._calItems.map((x) => (typeof x === "string" ? x : x?.entity)).filter(Boolean));
  }

  get _calView() {
    return this._calCfg.view === "calendar" ? "calendar" : "list";
  }

  get _calGroup() {
    return this._calCfg.group === true || this._calCfg.group === "true";
  }

  get _calMaxAll() {
    const m = Number(this._calCfg.max);
    return Number.isFinite(m) && m > 0 ? Math.floor(m) : null;
  }

  get _hueCfg() {
    const c = this.config?.hue ?? this.config?.licht ?? this.config?.lights;
    return c && typeof c === "object" && !Array.isArray(c) ? c : {};
  }

  get _hueSelected() {
    const e = this._hueCfg.entities;
    const list = Array.isArray(e) && e.length ? e : this._det?.hue || [];
    return new Set(list.map((x) => (typeof x === "string" ? x : x?.entity)).filter(Boolean));
  }

  _toggleHue(id, on) {
    const sel = new Set(this._hueSelected);
    if (on) sel.add(id);
    else sel.delete(id);
    this._fire({ hue: { ...this._hueCfg, entities: [...sel] } });
  }

  _toggleHueControl(on) {
    this._fire({ hue: { ...this._hueCfg, entities: [...this._hueSelected], control: on ? true : undefined } });
  }

  _renderHueOpts() {
    const det = (this._det && this._det.hue) || [];
    return html`
      <div class="sub">
        <div class="subhead">${t("Anzuzeigende Lichter")}</div>
        ${det.map(
          (id) => html`
            <label class="opt">
              <input type="checkbox" .checked=${this._hueSelected.has(id)} @change=${(ev) => this._toggleHue(id, ev.target.checked)} />
              <span class="grow">${this._fname(id)}</span>
            </label>
          `,
        )}
        <label class="opt">
          <input type="checkbox" .checked=${this._hueCfg.control === true} @change=${(ev) => this._toggleHueControl(ev.target.checked)} />
          <span>${t("Lichter steuerbar (an/aus per Klick)")}</span>
        </label>
      </div>
    `;
  }

  get _wasteCfg() {
    const c = this.config?.waste ?? this.config?.muell;
    return c && typeof c === "object" && !Array.isArray(c) ? c : {};
  }

  get _wasteSelected() {
    const e = this._wasteCfg.entities;
    const list = Array.isArray(e) && e.length ? e : this._det?.muell || [];
    return new Set(list.map((x) => (typeof x === "string" ? x : x?.entity)).filter(Boolean));
  }

  _fname(id) {
    return this._hass?.states?.[id]?.attributes?.friendly_name || id;
  }

  _toggleCal(id, on) {
    const items = this._calItems.filter((x) => (typeof x === "string" ? x : x?.entity) !== id);
    if (on) items.push(id);
    this._fire({ calendar: { ...this._calCfg, entities: items, view: this._calView } });
  }

  _setCalView(view) {
    this._fire({ calendar: { ...this._calCfg, entities: this._calItems, view } });
  }

  _setCalGroup(on) {
    this._fire({ calendar: { ...this._calCfg, entities: this._calItems, view: this._calView, group: on ? true : undefined } });
  }

  _setCalMaxAll(val) {
    const n = Number(val);
    this._fire({
      calendar: {
        ...this._calCfg,
        entities: this._calItems,
        view: this._calView,
        max: Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined,
      },
    });
  }

  _setCalMax(id, val) {
    const n = Number(val);
    const items = this._calItems.map((x) => {
      const eid = typeof x === "string" ? x : x?.entity;
      if (eid !== id) return x;
      if (Number.isFinite(n) && n > 0) return { ...(typeof x === "string" ? { entity: x } : x), max: Math.floor(n) };
      if (typeof x === "string") return x;
      const { max, ...rest } = x;
      return Object.keys(rest).length ? rest : x.entity;
    });
    this._fire({ calendar: { ...this._calCfg, entities: items, view: this._calView } });
  }

  _calMaxOf(id) {
    const it = this._calItems.find((x) => (typeof x === "string" ? x : x?.entity) === id);
    return typeof it === "object" && it?.max ? String(it.max) : "";
  }

  _toggleWaste(id, on) {
    const sel = new Set(this._wasteSelected);
    if (on) sel.add(id);
    else sel.delete(id);
    this._fire({ waste: { ...this._wasteCfg, entities: [...sel] } });
  }

  _renderCalendarOpts() {
    const det = (this._det && this._det.calendar) || [];
    return html`
      <div class="sub">
        <div class="subhead">${t("Kalender auswählen")}</div>
        ${det.map(
          (id) => html`
            <label class="opt">
              <input type="checkbox" .checked=${this._calSelected.has(id)} @change=${(ev) => this._toggleCal(id, ev.target.checked)} />
              <span class="grow">${this._fname(id)}</span>
              <input
                class="mini"
                type="number"
                min="1"
                max="50"
                placeholder=${t("alle")}
                title=${t("Max. Einträge pro Kalender")}
                .value=${this._calMaxOf(id)}
                @input=${(ev) => this._setCalMax(id, ev.target.value)}
              />
            </label>
          `,
        )}
        <label class="opt">
          <input type="checkbox" .checked=${this._calGroup} @change=${(ev) => this._setCalGroup(ev.target.checked)} />
          <span>${t("Pro Kalender gruppieren")}</span>
        </label>
        <div class="subhead">${t("Ansicht")}</div>
        <label class="opt">
          <input type="radio" name="calview" .checked=${this._calView === "list"} @change=${() => this._setCalView("list")} />
          <span>${t("Listenansicht")}</span>
        </label>
        <label class="opt">
          <input type="radio" name="calview" .checked=${this._calView === "calendar"} @change=${() => this._setCalView("calendar")} />
          <span>${t("Kalenderansicht")}</span>
        </label>
        <label class="fld">
          <span>${t("Max. Einträge")}</span>
          <input
            type="number"
            min="1"
            max="100"
            placeholder=${t("alle")}
            .value=${this._calMaxAll ?? ""}
            @input=${(ev) => this._setCalMaxAll(ev.target.value)}
          />
        </label>
      </div>
    `;
  }

  _renderWasteOpts() {
    const det = (this._det && this._det.muell) || [];
    return html`
      <div class="sub">
        <div class="subhead">${t("Abzuholende Tonnen")}</div>
        ${det.map(
          (id) => html`
            <label class="opt">
              <input type="checkbox" .checked=${this._wasteSelected.has(id)} @change=${(ev) => this._toggleWaste(id, ev.target.checked)} />
              <span>${this._fname(id)}</span>
            </label>
          `,
        )}
      </div>
    `;
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
        ${this._selected.has("calendar") ? this._renderCalendarOpts() : nothing}
        ${this._selected.has("hue") ? this._renderHueOpts() : nothing}
        ${this._selected.has("muell") ? this._renderWasteOpts() : nothing}
        <label class="fld">
          <span>${t("Titel")}</span>
          <input type="text" .value=${cfg.title || ""} placeholder="Modulares Dashboard" @input=${(ev) => this._fire({ title: ev.target.value || undefined })} />
        </label>
        <label class="fld">
          <span>${t("Entity-Präfix")}</span>
          <input type="text" .value=${cfg.prefix || ""} placeholder="evcc" @input=${(ev) => this._fire({ prefix: ev.target.value || undefined })} />
        </label>
        <label class="fld">
          <span>${t("Auto-Bild (Pfad)")}</span>
          <input type="text" .value=${cfg.image || ""} placeholder="/local/evcc/auto.png" @input=${(ev) => this._fire({ image: ev.target.value || undefined })} />
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
    .sub {
      border-top: 1px solid color-mix(in srgb, var(--primary-text-color, #212121) 12%, transparent);
      padding-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .subhead {
      font-size: .78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--secondary-text-color, #727272);
      margin-top: 6px;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: .9rem;
      padding: 4px 6px;
      border-radius: 8px;
      cursor: pointer;
    }
    .opt:hover { background: color-mix(in srgb, var(--primary-text-color, #212121) 6%, transparent); }
    .opt .grow { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mini {
      width: 64px;
      font: inherit;
      font-size: .85rem;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--primary-text-color, #212121) 18%, transparent);
      background: transparent;
      color: var(--primary-text-color, #212121);
    }
  `;
}
