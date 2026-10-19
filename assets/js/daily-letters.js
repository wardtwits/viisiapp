(function () {
  "use strict";

  const panel = document.querySelector("[data-daily-letters]");
  if (!panel) return;

  const letterList = panel.querySelector(".daily-letters-tiles");
  const tiles = letterList.querySelectorAll("li");
  const message = panel.querySelector("[data-daily-letters-message]");
  const DAY_MS = 24 * 60 * 60 * 1000;
  let schedule = null;
  let request = null;
  let currentDay = null;
  let rolloverTimer = null;
  let needsRetry = false;

  function setMessage(text) {
    if (message.textContent !== text) message.textContent = text;
  }

  function hideLetters(text) {
    letterList.hidden = true;
    tiles.forEach((tile) => {
      tile.textContent = "";
    });
    delete panel.dataset.puzzleDate;
    setMessage(text);
  }

  function puzzleDate(now = Date.now()) {
    // The app's puzzle date changes at its configured UTC offset, not local midnight.
    return new Date(now - schedule.puzzleDayOffsetSeconds * 1000)
      .toISOString().slice(0, 10);
  }

  async function loadSchedule() {
    if (request) return request;

    request = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("assets/puzzle-schedule.json", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Puzzle schedule request failed: ${response.status}`);
        const data = await response.json();
        if (
          !data || !Number.isInteger(data.puzzleDayOffsetSeconds) ||
          data.puzzleDayOffsetSeconds < 0 || data.puzzleDayOffsetSeconds >= 86400 ||
          !data.puzzles || typeof data.puzzles !== "object" || Array.isArray(data.puzzles)
        ) {
          throw new Error("Invalid puzzle schedule format");
        }
        return data;
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    try {
      return await request;
    } finally {
      request = null;
    }
  }

  function renderLetters() {
    const day = puzzleDate();
    const letters = schedule.puzzles[day];
    if (letters === undefined) {
      currentDay = day;
      hideLetters("Today’s letters are not available yet. Please check back soon.");
      return;
    }
    if (
      !Array.isArray(letters) || letters.length !== 5 ||
      !letters.every((letter) => typeof letter === "string" && /^[A-Z]$/.test(letter))
    ) {
      throw new Error(`Invalid puzzle letters for ${day}`);
    }

    tiles.forEach((tile, index) => {
      if (tile.textContent !== letters[index]) tile.textContent = letters[index];
    });
    letterList.setAttribute("aria-label", `Puzzle letters for ${day}`);
    letterList.hidden = false;
    panel.dataset.puzzleDate = day;
    currentDay = day;
    setMessage("Five letters. Can you find five words?");
  }

  function scheduleRollover() {
    window.clearTimeout(rolloverTimer);
    if (!schedule) return;
    const now = Date.now();
    const offset = schedule.puzzleDayOffsetSeconds * 1000;
    const next = (Math.floor((now - offset) / DAY_MS) + 1) * DAY_MS + offset;
    rolloverTimer = window.setTimeout(() => refresh(true), next - now + 50);
  }

  async function refresh(forceFetch = false) {
    const dayChanged = schedule && puzzleDate() !== currentDay;
    if (dayChanged) hideLetters("Loading today’s letters…");
    try {
      if (!schedule || forceFetch || needsRetry || dayChanged) schedule = await loadSchedule();
      renderLetters();
      needsRetry = false;
    } catch (error) {
      needsRetry = true;
      hideLetters("Couldn’t load today’s letters. Please try again shortly.");
      console.error("Unable to refresh Viisi daily letters:", error);
    } finally {
      scheduleRollover();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh(true);
  });
  window.addEventListener("focus", () => refresh(true));
  window.addEventListener("pageshow", () => refresh(true));
  window.addEventListener("online", () => refresh(true));
  // Also catches clock changes and delayed timers after a device sleeps.
  window.setInterval(() => refresh(), 60000);
  hideLetters("Loading today’s letters…");
  refresh();
})();
