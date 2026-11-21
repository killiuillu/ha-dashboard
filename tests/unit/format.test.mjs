import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { esc, fmt, fmtInt, num } from "../../src/util/format.js";

test("fmt formatiert lokalisiert und behandelt Nicht-Zahlen als –", () => {
  setLang({ language: "de" });
  assert.equal(fmt(1234.5, 1), "1.234,5");
  assert.equal(fmtInt(1234.5), "1.235");
  assert.equal(fmt(null), "–");
  assert.equal(fmt("unavailable"), "–");
  setLang({ language: "en" });
  assert.equal(fmt(1234.5, 1), "1,234.5");
  setLang({ language: "de" });
});

test("num parst HA-States, unavailable/unknown werden null", () => {
  assert.equal(num({ state: "42.5" }), 42.5);
  assert.equal(num({ state: "-1200" }), -1200);
  assert.equal(num({ state: "unavailable" }), null);
  assert.equal(num({ state: "abc" }), null);
  assert.equal(num(undefined), null);
});

test("esc maskiert HTML", () => {
  assert.equal(esc('<b>"x"&</b>'), "&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;");
  assert.equal(esc(null), "");
});
