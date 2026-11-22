import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t, loc } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { detectAreas, fmtTemp } from "../util/rooms.js";

export class ModularRoomsCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true }, _sel: { state: true } };

  static getStubConfig() {
    return { title: t("Räume"), control: true };
  }

  getCardSize() {
    return 3;
  }

  get _control() {
    return this._config?.control === true || this._config?.control === "true";
  }

  get _areas() {
    const all = detectAreas(this.hass);
    const want = this._config?.areas;
    if (Array.isArray(want) && want.length) return all.filter((a) => want.includes(a.area_id));
    return all;
  }

  _mountDetail(container, area) {
    container.innerHTML = "";
    if (!area) return;
    const mk = (tag, cfg) => {
      const el = document.createElement(tag);
      el.setConfig(cfg);
      el.hass = this.hass;
      container.appendChild(el);
    };
    if (area.lights.length) {
      mk("modular-lights-card", {
        title: t("Lichter"),
        entities: area.lights,
        control: this._control,
      });
    }
    for (const id of area.climates) {
      if (customElements.get("hui-climate-card")) mk("hui-climate-card", { entity: id });
      else this._appendRow(container, id);
    }
    for (const id of area.media) {
      if (customElements.get("hui-media-control-card")) mk("hui-media-control-card", { entity: id });
      else this._appendRow(container, id);
    }
    if (area.others.length) {
      if (customElements.get("hui-entities-card")) mk("hui-entities-card", { title: t("Weitere"), entities: area.others });
      else for (const id of area.others) this._appendRow(container, id);
    }
  }

  _appendRow(container, id) {
    const s = this.hass?.states?.[id];
    const row = document.createElement("div");
    row.className = "lrow";
    row.innerHTML = `<span class="lname">${s?.attributes?.friendly_name || id}</span><span class="chip">${s?.state ?? "–"}</span>`;
    container.appendChild(row);
  }

  updated() {
    const detail = this.renderRoot?.querySelector(".roomdetail");
    if (detail) this._mountDetail(detail, this._areas.find((a) => a.area_id === this._sel));
  }

  render() {
    const cfg = this._config || {};
    const title = cfg.title || t("Räume");
    const tone = toneVar("air");
    const areas = this._areas;
    if (!areas.length) {
      return html`<ha-card><div class="err">${t("Keine Räume erkannt")}</div></ha-card>`;
    }
    const sel = areas.find((a) => a.area_id === this._sel) || null;
    return html`
      <ha-card class="rcard" style="--tone:${tone};--accent:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Übersicht aller Räume mit Temperatur und Licht-Indikator. Klick auf einen Raum öffnet die Steuerung (Lichter, Heizung/Klima, Media Player).")}</div>`
          : nothing}
        <div class="rooms">
          ${areas.map((a) => {
            const lc = a.lightsOn > 0 ? toneVar("warn") : toneVar("off");
            return html`
              <button
                class="room${a.area_id === this._sel ? " sel" : ""}"
                style="--lc:${lc}"
                aria-pressed=${a.area_id === this._sel ? "true" : "false"}
                @click=${() => (this._sel = this._sel === a.area_id ? null : a.area_id)}
              >
                <ha-icon icon="${a.icon}"></ha-icon>
                <span class="rname">${a.name}</span>
                <span class="rmeta">
                  <i class="rdot" title="${a.lightsOn}/${a.lights.length} ${t("Lichter")} ${t("An")}"></i>
                  <span class="rtemp">${fmtTemp(a.temp, loc)}</span>
                </span>
              </button>
            `;
          })}
        </div>
        <div class="roomdetail">${sel ? html`<div class="evday">${sel.name}</div>` : nothing}</div>
      </ha-card>
    `;
  }
}
