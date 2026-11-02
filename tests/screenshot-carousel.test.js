const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../assets/js/screenshot-carousel.js"), "utf8");

function openCarousel({ reducedMotion = false, counts = [3, 2] } = {}) {
  const requests = [];
  const errors = [];
  const timers = new Map();
  const listeners = {};
  let nextTimer = 0;
  function classList(active = false) {
    const names = new Set(active ? ["is-active"] : []);
    return {
      contains: (name) => names.has(name),
      add: (name) => names.add(name),
      remove: (name) => names.delete(name),
      toggle(name, enabled) { enabled ? names.add(name) : names.delete(name); },
    };
  }
  function image(theme, index) {
    const events = {};
    let src = index === 0 ? `${theme}1.webp` : "";
    return {
      classList: classList(index === 0),
      dataset: index === 0 ? {} : { src: `${theme}${index + 1}.webp` },
      complete: true,
      naturalWidth: index === 0 ? 1170 : 0,
      get src() { return src; },
      set src(value) {
        src = value;
        this.complete = false;
        this.naturalWidth = 0;
        requests.push(value);
      },
      addEventListener(type, callback) { events[type] = callback; },
      removeEventListener(type, callback) { if (events[type] === callback) delete events[type]; },
      finish(type = "load") {
        this.complete = true;
        this.naturalWidth = type === "load" ? 1170 : 0;
        if (events[type]) events[type]();
      },
    };
  }
  const sets = counts.map((count, theme) => {
    const images = Array.from({ length: count }, (_, index) => image(theme, index));
    return {
      images,
      offsetParent: theme === 0 ? {} : null,
      querySelectorAll: () => images,
      querySelector: () => images.find((item) => item.classList.contains("is-active")),
    };
  });
  const label = { textContent: "Pause" };
  const toggle = {
    hidden: true,
    classList: classList(),
    querySelector: () => label,
    addEventListener(type, callback) { listeners[type] = callback; },
  };
  const motion = {
    matches: reducedMotion,
    addEventListener(type, callback) { listeners.motion = callback; },
  };
  vm.runInNewContext(source, {
    document: {
      querySelectorAll: () => sets,
      querySelector: () => toggle,
    },
    window: {
      matchMedia: () => motion,
      setInterval(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
      clearInterval(id) { timers.delete(id); },
    },
    console: { error: (...args) => errors.push(args) },
  });
  return {
    sets, requests, errors, toggle, label, timers,
    tick() { [...timers.values()].forEach((callback) => callback()); },
    pauseOrPlay() { listeners.click(); },
    setReducedMotion(value) { motion.matches = value; listeners.motion(); },
    active(set = sets[0]) { return set.images.findIndex((item) => item.classList.contains("is-active")); },
  };
}

test("loads only the next visible-theme slide and keeps the current image until it loads", () => {
  const page = openCarousel();
  assert.deepEqual(page.requests, []);
  page.tick();
  assert.deepEqual(page.requests, ["02.webp"]);
  assert.equal(page.active(), 0);
  page.tick();
  assert.equal(page.requests.length, 1, "a slow image must not start duplicate requests");
  page.sets[0].images[1].finish();
  assert.equal(page.active(), 1);
  assert.equal(page.active(page.sets[1]), 0);
});

test("a failed download leaves the current image visible, reports the error, and can retry", () => {
  const page = openCarousel();
  page.tick();
  page.sets[0].images[1].finish("error");
  assert.equal(page.active(), 0);
  assert.equal(page.errors.length, 1);
  page.tick();
  assert.equal(page.requests.length, 2);
  page.sets[0].images[1].finish();
  assert.equal(page.active(), 1);
});

test("pausing during a download prevents a late slide change and resumes with the cached image", () => {
  const page = openCarousel();
  page.tick();
  page.pauseOrPlay();
  page.sets[0].images[1].finish();
  assert.equal(page.active(), 0);
  assert.equal(page.timers.size, 0);
  assert.equal(page.label.textContent, "Play");
  page.pauseOrPlay();
  page.tick();
  assert.equal(page.active(), 1);
  assert.equal(page.requests.length, 1);
  assert.equal(page.label.textContent, "Pause");
});

test("reduced motion keeps the first slide visible without downloading inactive slides", () => {
  const page = openCarousel({ reducedMotion: true });
  assert.equal(page.timers.size, 0);
  assert.equal(page.toggle.hidden, true);
  page.tick();
  assert.deepEqual(page.requests, []);
  page.setReducedMotion(false);
  page.tick();
  page.setReducedMotion(true);
  page.sets[0].images[1].finish();
  assert.equal(page.active(), 0);
  assert.equal(page.timers.size, 0);
});

test("switching themes during a download does not advance the hidden theme", () => {
  const page = openCarousel();
  page.tick();
  page.sets[0].offsetParent = null;
  page.sets[1].offsetParent = {};
  page.sets[0].images[1].finish();
  assert.equal(page.active(), 0);
  page.tick();
  assert.deepEqual(page.requests, ["02.webp", "12.webp"]);
  page.sets[1].images[1].finish();
  assert.equal(page.active(page.sets[1]), 1);
});

test("each theme wraps using its own slide count without downloading a cached first slide", () => {
  const page = openCarousel({ counts: [2, 3] });
  page.tick();
  page.sets[0].images[1].finish();
  page.tick();
  assert.equal(page.active(), 0);
  assert.equal(page.requests.length, 1);
  page.sets[0].offsetParent = null;
  page.sets[1].offsetParent = {};
  page.tick();
  page.sets[1].images[1].finish();
  page.tick();
  page.sets[1].images[2].finish();
  assert.equal(page.active(page.sets[1]), 2);
  page.tick();
  assert.equal(page.active(page.sets[1]), 0);
  assert.equal(page.requests.length, 3);
});

test("pages without screenshot sets do not start a timer", () => {
  assert.equal(openCarousel({ counts: [] }).timers.size, 0);
});
