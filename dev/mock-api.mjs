const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const dateOnly = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const at = (d, h, m = 0) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

// Kalender-Events relativ zu "heute", damit Tests/Dev-Seite zu jedem Datum laufen
export function buildApi(now = new Date()) {
  return {
    "calendars/calendar.familie": [
      { summary: "Zahnarzt", start: { dateTime: at(now, 9) }, end: { dateTime: at(now, 10) } },
      { summary: "Elternabend Schule", start: { dateTime: at(addDays(now, 2), 19) }, end: { dateTime: at(addDays(now, 2), 21) } },
      { summary: "Urlaub", start: { date: dateOnly(addDays(now, 5)) }, end: { date: dateOnly(addDays(now, 10)) } },
    ],
    "calendars/calendar.arbeit": [
      { summary: "Team-Meeting", start: { dateTime: at(addDays(now, 1), 10) }, end: { dateTime: at(addDays(now, 1), 11) } },
      { summary: "Release", start: { date: dateOnly(addDays(now, 3)) }, end: { date: dateOnly(addDays(now, 4)) } },
    ],
  };
}

export function callApiMock(api) {
  return async (method, path) => {
    const key = String(path).split("?")[0];
    return structuredClone(api[key] ?? []);
  };
}
