const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/js/daily-letters.js"), "utf8");
const schedule = JSON.parse(fs.readFileSync(path.join(root, "assets/puzzle-schedule.json"), "utf8"));
const settle = () => new Promise(setImmediate);

function openPage(instant, data = schedule) {
  let now = Date.parse(instant);
  let nextTimer = 0;
  let response = async () => ({ ok: true, json: async () => structuredClone(data) });
  const timers = new Map();
  const intervals = [];
  const events = {};
  const errors = [];
  const requests = [];
  const tiles = Array.from({ length: 5 }, () => ({ textContent: "" }));
  const list = {
    hidden: true,
    querySelectorAll: () => tiles,
    setAttribute(name, value) { this[name] = value; },
  };
  const message = { textContent: "Open Viisi to see today’s letters." };
  const panel = {
    dataset: {},
    querySelector: (selector) => selector === ".daily-letters-tiles" ? list : message,
  };
  const document = {
    visibilityState: "visible",
    querySelector: () => panel,
    addEventListener(type, callback) { events[type] = callback; },
  };
  const window = {
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback) { intervals.push(callback); },
    addEventListener(type, callback) { events[type] = callback; },
  };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  vm.runInNewContext(source, {
    document, window, Date: Clock, AbortController,
    console: { error: (...args) => errors.push(args) },
    fetch(url, options) {
      requests.push({ url, options });
      return response(options);
    },
  });

  return {
    list, message, panel, errors, requests, document,
    letters: () => tiles.map((tile) => tile.textContent).join(""),
    setTime(instant) { now = Date.parse(instant); },
    respondWith(callback) { response = callback; },
    dispatch(type) { events[type](); },
    checkMinute() { intervals.forEach((callback) => callback()); },
    runDueTimers() {
      for (const [id, timer] of [...timers]) {
        if (timer.due <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
    nextTimer: () => Math.min(...[...timers.values()].map((timer) => timer.due)),
  };
}

test("uses yesterday before 06:00 UTC and today's exact letter order at reset", async () => {
  const before = openPage("2026-10-19T05:59:59.999Z");
  const after = openPage("2026-10-19T06:00:00.000Z");
  await settle();
  assert.equal(before.letters(), "ASBUT");
  assert.equal(before.panel.dataset.puzzleDate, "2026-10-18");
  assert.equal(after.letters(), "ERNSA");
  assert.equal(after.panel.dataset.puzzleDate, "2026-10-19");
  assert.equal(after.list.hidden, false);
  assert.equal(after.requests[0].url, "assets/puzzle-schedule.json");
  assert.equal(after.requests[0].options.cache, "no-store");
});

test("preserves repeated letters", async () => {
  const page = openPage("2026-09-15T12:00:00Z");
  await settle();
  assert.equal(page.letters(), "OOSRT");
});

for (const [date, expected] of [
  ["2026-09-12T06:00:00Z", "SEMLA"],
  ["2027-10-13T05:59:59Z", "ADERC"],
]) {
  test(`supports schedule boundary ${date}`, async () => {
    const page = openPage(date);
    await settle();
    assert.equal(page.letters(), expected);
    assert.equal(page.list.hidden, false);
  });
}

test("daylight saving time changes do not move the UTC reset", async () => {
  const before = openPage("2026-11-01T05:59:59Z");
  const after = openPage("2026-11-01T06:00:00Z");
  await settle();
  assert.equal(before.letters(), "SREET");
  assert.equal(after.letters(), "NAESP");
});

test("updates an open page at the UTC reset without a reload", async () => {
  const page = openPage("2026-10-19T05:59:59.900Z");
  await settle();
  assert.equal(page.nextTimer(), Date.parse("2026-10-19T06:00:00.050Z"));
  page.setTime("2026-10-19T06:00:00.050Z");
  page.runDueTimers();
  assert.equal(page.list.hidden, true, "yesterday's tiles are hidden while refreshing");
  await settle();
  assert.equal(page.letters(), "ERNSA");
  assert.equal(page.requests.length, 2);
});

test("UTC midnight does not advance the puzzle or repeatedly download the schedule", async () => {
  const page = openPage("2026-10-19T23:59:59Z");
  await settle();
  page.setTime("2026-10-20T00:00:00Z");
  page.checkMinute();
  await settle();
  assert.equal(page.letters(), "ERNSA");
  assert.equal(page.requests.length, 1);
});

for (const event of ["focus", "visibilitychange", "pageshow", "online"]) {
  test(`${event} catches up after a sleeping tab skips a reset`, async () => {
    const page = openPage("2026-10-19T12:00:00Z");
    await settle();
    page.setTime("2026-10-20T12:00:00Z");
    page.dispatch(event);
    await settle();
    assert.equal(page.letters(), "EROST");
    assert.equal(page.requests.length, 2);
  });
}

test("hidden tabs do not refetch on visibilitychange", async () => {
  const page = openPage("2026-10-19T12:00:00Z");
  await settle();
  page.document.visibilityState = "hidden";
  page.dispatch("visibilitychange");
  await settle();
  assert.equal(page.requests.length, 1);
});

test("the minute check catches a missed timer and a backwards clock change", async () => {
  const page = openPage("2026-10-19T12:00:00Z");
  await settle();
  page.setTime("2026-10-20T12:00:00Z");
  page.checkMinute();
  await settle();
  assert.equal(page.letters(), "EROST");
  page.setTime("2026-10-19T05:00:00Z");
  page.checkMinute();
  await settle();
  assert.equal(page.letters(), "ASBUT");
});

for (const date of ["2026-09-12T05:59:59Z", "2027-10-13T06:00:00Z"]) {
  test(`out-of-range date ${date} never wraps to another puzzle`, async () => {
    const page = openPage(date);
    await settle();
    assert.equal(page.list.hidden, true);
    assert.equal(page.letters(), "");
    assert.match(page.message.textContent, /not available yet/);
    assert.equal(page.panel.dataset.puzzleDate, undefined);
  });
}

for (const [name, failure] of [
  ["offline", async () => { throw new Error("Offline"); }],
  ["HTTP 404", async () => ({ ok: false, status: 404 })],
  ["invalid JSON", async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })],
  ["invalid metadata", async () => ({ ok: true, json: async () => ({ puzzles: {} }) })],
]) {
  test(`failed schedule (${name}) clears letters and retries`, async () => {
    const page = openPage("2026-10-19T12:00:00Z");
    await settle();
    page.respondWith(failure);
    page.dispatch("focus");
    await settle();
    assert.equal(page.list.hidden, true);
    assert.equal(page.letters(), "");
    assert.match(page.message.textContent, /Couldn’t load/);
    assert.equal(page.errors.length, 1);
    page.respondWith(async () => ({ ok: true, json: async () => schedule }));
    page.checkMinute();
    await settle();
    assert.equal(page.letters(), "ERNSA");
    assert.equal(page.list.hidden, false);
  });
}

test("follows the schedule's offset instead of hardcoding 06:00 UTC", async () => {
  const midnightSchedule = { ...schedule, puzzleDayOffsetSeconds: 0 };
  const page = openPage("2026-10-19T00:00:00Z", midnightSchedule);
  await settle();
  assert.equal(page.letters(), "ERNSA");
  assert.equal(page.nextTimer(), Date.parse("2026-10-20T00:00:00.050Z"));
});

test("rolls over correctly across New Year's Day", async () => {
  const before = openPage("2027-01-01T05:59:59Z");
  const after = openPage("2027-01-01T06:00:00Z");
  await settle();
  assert.equal(before.letters(), "ELPTA");
  assert.equal(after.letters(), "SDETI");
});

test("invalid letters are not shown, and a corrected schedule recovers", async () => {
  const bad = structuredClone(schedule);
  bad.puzzles["2026-10-19"] = ["A", "B", "<script>", "C", "D"];
  const page = openPage("2026-10-19T12:00:00Z", bad);
  await settle();
  assert.equal(page.list.hidden, true);
  assert.equal(page.letters(), "");
  assert.match(page.message.textContent, /Couldn’t load/);
  page.respondWith(async () => ({ ok: true, json: async () => schedule }));
  page.dispatch("online");
  await settle();
  assert.equal(page.letters(), "ERNSA");
});

test("concurrent resume events share a request, and slow responses use the date on arrival", async () => {
  const page = openPage("2026-10-19T05:59:59Z");
  await settle();
  let resolve;
  page.respondWith(() => new Promise((done) => { resolve = done; }));
  page.dispatch("focus");
  page.dispatch("online");
  assert.equal(page.requests.length, 2);
  page.setTime("2026-10-19T06:00:01Z");
  resolve({ ok: true, json: async () => schedule });
  await settle();
  assert.equal(page.letters(), "ERNSA");
});

test("hung requests time out and can recover when connectivity returns", async () => {
  const page = openPage("2026-10-19T12:00:00Z");
  await settle();
  page.respondWith(({ signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("Request timed out")));
  }));
  page.dispatch("focus");
  page.setTime("2026-10-19T12:00:10Z");
  page.runDueTimers();
  await settle();
  assert.equal(page.list.hidden, true);
  assert.match(page.message.textContent, /Couldn’t load/);
  page.respondWith(async () => ({ ok: true, json: async () => schedule }));
  page.dispatch("online");
  await settle();
  assert.equal(page.letters(), "ERNSA");
});
