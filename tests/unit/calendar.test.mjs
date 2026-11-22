import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import {
  parseCalendarEntities,
  normalizeEvent,
  sortEvents,
  eventsByDay,
  monthGrid,
  dayKey,
  fmtEventTime,
  fetchCalendarEvents,
  calendarListEntries,
  CALENDAR_COLORS,
} from "../../src/util/calendar.js";

setLang({ language: "de" });

test("parseCalendarEntities: String, Array, Objekte mit name/color, Farben rotieren", () => {
  assert.deepEqual(parseCalendarEntities("calendar.a"), [{ entity: "calendar.a", name: null, color: CALENDAR_COLORS[0], max: null }]);
  const list = parseCalendarEntities(["calendar.a", { entity: "calendar.b", name: "Arbeit", color: "#123456" }]);
  assert.equal(list.length, 2);
  assert.equal(list[1].name, "Arbeit");
  assert.equal(list[1].color, "#123456");
  assert.deepEqual(parseCalendarEntities({ entities: ["calendar.x"] }).map((c) => c.entity), ["calendar.x"]);
  assert.deepEqual(parseCalendarEntities(undefined), []);
  assert.deepEqual(parseCalendarEntities([{ name: "ohne entity" }]), []);
});

test("normalizeEvent: dateTime vs. ganztägig (date), Enddatum-Fallback", () => {
  const timed = normalizeEvent({ entity: "calendar.a", color: "#111" }, {
    summary: "Zahnarzt",
    start: { dateTime: "2026-11-22T09:00:00+01:00" },
    end: { dateTime: "2026-11-22T10:00:00+01:00" },
  });
  assert.equal(timed.allDay, false);
  assert.equal(timed.start.getUTCHours(), 8);
  const allday = normalizeEvent({ entity: "calendar.a", color: "#111" }, {
    summary: "Urlaub",
    start: { date: "2026-11-25" },
    end: { date: "2026-11-30" },
  });
  assert.equal(allday.allDay, true);
  const noEnd = normalizeEvent({ entity: "calendar.a", color: "#111" }, { summary: "X", start: { dateTime: "2026-11-22T09:00:00+01:00" } });
  assert.equal(noEnd.end.getTime(), noEnd.start.getTime());
});

test("sortEvents sortiert nach Startzeit", () => {
  const evs = [
    normalizeEvent({ entity: "c", color: "#1" }, { summary: "B", start: { dateTime: "2026-11-22T10:00:00+01:00" } }),
    normalizeEvent({ entity: "c", color: "#1" }, { summary: "A", start: { dateTime: "2026-11-22T09:00:00+01:00" } }),
  ];
  assert.deepEqual(sortEvents(evs).map((e) => e.summary), ["A", "B"]);
});

test("eventsByDay: ganztägiger Mehrtagstermin spannt alle Tage (Ende exklusiv)", () => {
  const ev = normalizeEvent({ entity: "c", color: "#1" }, { summary: "Urlaub", start: { date: "2026-11-25" }, end: { date: "2026-11-28" } });
  const map = eventsByDay([ev]);
  assert.deepEqual(Object.keys(map).sort(), ["2026-11-25", "2026-11-26", "2026-11-27"]);
  const timed = normalizeEvent({ entity: "c", color: "#1" }, { summary: "M", start: { dateTime: "2026-11-25T10:00:00+01:00" }, end: { dateTime: "2026-11-25T11:00:00+01:00" } });
  assert.deepEqual(Object.keys(eventsByDay([timed])), ["2026-11-25"]);
});

test("monthGrid: 6 Wochen à 7 Tage, Montag-Start (Nov 2026 beginnt am So 1.11.)", () => {
  const weeks = monthGrid(2026, 10);
  assert.equal(weeks.length, 6);
  assert.ok(weeks.every((w) => w.length === 7));
  const first = weeks[0][0].date;
  assert.equal(first.getDay(), 1);
  assert.equal(dayKey(first), "2026-10-26");
  assert.equal(weeks[0][0].inMonth, false);
  assert.equal(weeks[0][6].inMonth, true);
  assert.equal(dayKey(weeks[0][6].date), "2026-11-01");
  assert.equal(weeks[5][6].inMonth, false);
});

test("fmtEventTime: ganztägig, gleicher Tag, mehrtägig", () => {
  const allday = normalizeEvent({ entity: "c", color: "#1" }, { summary: "U", start: { date: "2026-11-25" }, end: { date: "2026-11-26" } });
  assert.equal(fmtEventTime(allday), "ganztägig");
  const same = { allDay: false, start: new Date(2026, 10, 25, 9, 0), end: new Date(2026, 10, 25, 10, 30) };
  assert.equal(fmtEventTime(same), "09:00–10:30");
});

test("fetchCalendarEvents: merged + sortiert über callApi (REST pro Kalender)", async () => {
  const hass = {
    callApi: async (method, path) => {
      assert.equal(method, "GET");
      if (path.startsWith("calendars/calendar.a")) {
        return [{ summary: "Später", start: { dateTime: "2026-11-22T15:00:00+01:00" }, end: { dateTime: "2026-11-22T16:00:00+01:00" } }];
      }
      if (path.startsWith("calendars/calendar.b")) {
        return [{ summary: "Früher", start: { dateTime: "2026-11-22T08:00:00+01:00" }, end: { dateTime: "2026-11-22T09:00:00+01:00" } }];
      }
      return [];
    },
  };
  const cals = parseCalendarEntities(["calendar.a", "calendar.b"]);
  const evs = await fetchCalendarEvents(hass, cals, new Date("2026-11-22T00:00:00+01:00"), new Date("2026-11-23T00:00:00+01:00"));
  assert.deepEqual(evs.map((e) => e.summary), ["Früher", "Später"]);
  assert.equal(evs[0].calendar, "calendar.b");
});

test("fetchCalendarEvents: Fallback über callWS calendar/event/list, Fehler => leer", async () => {
  const hass = {
    callWS: async (msg) => {
      assert.equal(msg.type, "calendar/event/list");
      return [{ summary: "WS", start: { dateTime: "2026-11-22T08:00:00+01:00" }, end: { dateTime: "2026-11-22T09:00:00+01:00" } }];
    },
  };
  const evs = await fetchCalendarEvents(hass, parseCalendarEntities(["calendar.a"]), new Date("2026-11-22T00:00:00Z"), new Date("2026-11-23T00:00:00Z"));
  assert.equal(evs.length, 1);
  const broken = { callApi: async () => { throw new Error("nope"); } };
  assert.deepEqual(await fetchCalendarEvents(broken, parseCalendarEntities(["calendar.a"]), new Date(), new Date()), []);
});

test("parseCalendarEntities: max pro Kalender wird übernommen (ungültig => null)", () => {
  const list = parseCalendarEntities([{ entity: "calendar.a", max: 3 }, { entity: "calendar.b", max: "x" }, "calendar.c"]);
  assert.equal(list[0].max, 3);
  assert.equal(list[1].max, null);
  assert.equal(list[2].max, null);
});

test("calendarListEntries merged: sortiert, auf max begrenzt, vergangene Events raus", () => {
  const now = new Date(2026, 10, 22, 12, 0);
  const mk = (sum, day) => normalizeEvent({ entity: "calendar.a", color: "#1" }, { summary: sum, start: { dateTime: new Date(2026, 10, day, 9, 0).toISOString() }, end: { dateTime: new Date(2026, 10, day, 10, 0).toISOString() } });
  const evs = [mk("C", 24), mk("A", 22), mk("B", 23), mk("alt", 20)];
  const cals = parseCalendarEntities(["calendar.a"]);
  const all = calendarListEntries(evs, cals, { max: null, now });
  assert.deepEqual(all.map((e) => e.summary), ["A", "B", "C"]);
  assert.deepEqual(calendarListEntries(evs, cals, { max: 2, now }).map((e) => e.summary), ["A", "B"]);
});

test("calendarListEntries gruppiert: eigene Liste je Kalender, max pro Kalender, Fallback Karten-max", () => {
  const now = new Date(2026, 10, 22, 12, 0);
  const mk = (cal, sum, day) => normalizeEvent({ entity: cal, color: "#1" }, { summary: sum, start: { dateTime: new Date(2026, 10, day, 9, 0).toISOString() }, end: { dateTime: new Date(2026, 10, day, 10, 0).toISOString() } });
  const evs = [mk("calendar.fam", "F1", 22), mk("calendar.fam", "F2", 23), mk("calendar.fam", "F3", 24), mk("calendar.arb", "A1", 22), mk("calendar.arb", "A2", 25)];
  const cals = parseCalendarEntities([{ entity: "calendar.fam", max: 2 }, "calendar.arb"]);
  const groups = calendarListEntries(evs, cals, { group: true, max: 1, now });
  assert.equal(groups.length, 2);
  assert.equal(groups[0].cal.entity, "calendar.fam");
  assert.deepEqual(groups[0].events.map((e) => e.summary), ["F1", "F2"]);
  assert.equal(groups[0].total, 3);
  assert.deepEqual(groups[1].events.map((e) => e.summary), ["A1"]);
  assert.equal(groups[1].total, 2);
});
