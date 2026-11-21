import { LitElement } from "lit";
import { setLang } from "../i18n/index.js";
import { cardStyles } from "../styles/card-styles.js";
import { changed, collectIds } from "../util/hass.js";

export class EvccBaseCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = [cardStyles];

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("evcc-Karte braucht ein Konfigurationsobjekt");
    this._config = config;
  }

  static getStubConfig() {
    return { title: "" };
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  get entityMap() {
    return (this._config && this._config.entities) || {};
  }

  entityIds() {
    return collectIds(this.entityMap);
  }

  shouldUpdate(changedProps) {
    if (changedProps.has("hass") && this.hass) {
      setLang(this.hass);
      if (changedProps.size === 1 && !changed(this, this.hass, this.entityIds())) return false;
    }
    return true;
  }
}
