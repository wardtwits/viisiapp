(async () => {
  "use strict";
  const STORAGE_KEY = "viisi.web.demo.v5";
  const LEGACY_KEY = "viisi.web.demo.v4";
  const $ = (id) => document.getElementById(id);
  const board = document.querySelector(".phone-inner");
  if (!board) return;
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let game,
    puzzleData,
    storageFailure = false,
    blockedKey,
    generation = 0,
    busy = false;
  let boardVisible = true;
  let selectedWord = null,
    pendingAction = null,
    returnFocus,
    lastTick = Date.now();
  let timerSave = Date.now(),
    deleteDelay,
    deleteRepeat;
  const sounds = new Map();
  const letterFlights = new Map();
  const activeAnimations = new Set();
  const keyButtons = [];
  const entryTiles = [];
  const dateText = (options) =>
    game.puzzle.date
      ? new Date(`${game.puzzle.date}T12:00:00`).toLocaleDateString(
          "en-US",
          options,
        )
      : "Practice Puzzle";
  const timeText = () => {
    const seconds = Math.floor(game.state.elapsedMs / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const message = (text, tone = "normal") => {
    $("message").textContent = text;
    $("message").dataset.tone = tone;
  };
  const notice = (text) => {
    $("saveNotice").hidden = false;
    $("saveNotice").textContent = text;
  };
  function save() {
    if (!game || storageFailure) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game.toJSON()));
    } catch {
      storageFailure = true;
      notice(
        "Your browser could not save this demo. You can keep playing, but this run may not survive a reload.",
      );
    }
  }
  function tick() {
    const now = Date.now();
    if (
      game &&
      !document.hidden &&
      boardVisible &&
      !document.querySelector("dialog[open]")
    )
      game.tick(Math.max(0, now - lastTick));
    lastTick = now;
    if (game) $("runTimer").textContent = timeText();
  }
  function playSound(name) {
    if (!game.settings.sound) return;
    if (!sounds.has(name))
      sounds.set(name, new Audio(`assets/demo/${name}.m4a`));
    const sound = sounds.get(name);
    sound.currentTime = 0;
    sound
      .play()
      .catch(() =>
        notice(
          "Sound could not play in this browser. Check your browser's audio permissions or turn sound off in Game settings.",
        ),
      );
  }
  function appearance() {
    const preference = game.settings.appearance;
    board.dataset.theme =
      preference === "system"
        ? systemTheme.matches
          ? "dark"
          : "light"
        : preference;
    board.dataset.contrast = game.settings.highContrast ? "high" : "native";
  }
  function tileWord(word, className = "found-word", hints = []) {
    const wordElement = document.createElement("button");
    wordElement.type = "button";
    wordElement.className = className;
    wordElement.setAttribute("aria-label", `Definition of ${word}`);
    [...word].forEach((letter, column) => {
      const tile = document.createElement("span");
      tile.textContent = letter;
      tile.setAttribute("aria-hidden", "true");
      if (hints.includes(column)) tile.className = "hint-supplied";
      wordElement.append(tile);
    });
    return wordElement;
  }
  function renderWords() {
    const state = game.state;
    const focusedWord = document.activeElement?.dataset.word;
    $("discoveredWords").replaceChildren();
    [...state.words, ...state.revealedWords].forEach((word, row) => {
      const revealed = row >= state.words.length;
      const item = document.createElement("li");
      const button = tileWord(
        word,
        `found-word${revealed ? " revealed" : game.puzzle.specialWords.includes(word) ? " special" : ""}`,
        state.wordHints[row] || [],
      );
      button.dataset.word = word;
      button.disabled = state.status === "playing";
      button.setAttribute("aria-pressed", String(word === selectedWord));
      button.addEventListener("click", () => showDefinition(word));
      item.append(button);
      if (state.hintedRows.includes(row)) {
        const hint = document.createElement("img");
        hint.src = "assets/demo/hint-bulb.webp";
        hint.alt = "Hint used";
        hint.className = "found-hint";
        item.append(hint);
      }
      $("discoveredWords").append(item);
      if (focusedWord === word) button.focus({ preventScroll: true });
    });
  }
  function renderEntry(word = game.state.entry, hints = game.state.entryHints) {
    entryTiles.forEach((tile, column) => {
      tile.textContent = word[column] || "";
      tile.className = `entry-tile${word[column] ? " filled" : ""}${hints.includes(column) ? " hint-supplied" : ""}${letterFlights.has(column) ? " arriving" : ""}`;
    });
    $("entryRow").setAttribute(
      "aria-label",
      `Current word: ${word || "empty"}`,
    );
    $("endActionBtn").disabled = busy;
    $("hintBtn").disabled = busy || !game.canHint;
    $("shuffleBtn").disabled = busy || game.state.status !== "playing";
    $("deleteBtn").disabled =
      busy || game.state.status !== "playing" || !game.state.entry;
    const used = game.usedIndices;
    keyButtons.forEach((button, index) => {
      button.textContent = game.state.letters[index];
      button.setAttribute("aria-label", game.state.letters[index]);
      button.setAttribute(
        "aria-disabled",
        String(used.includes(index) || game.state.status !== "playing" || busy),
      );
    });
  }
  function render() {
    const state = game.state;
    const terminal = state.status !== "playing";
    board.dataset.status = state.status;
    board.dataset.mode = state.mode;
    board.dataset.hints =
      state.mode === "classic" && state.words.length >= 3
        ? "available"
        : "none";
    appearance();
    $("gameMode").dataset.practice = String(
      !game.puzzle.date && !state.words.length,
    );
    $("soundBtn").disabled = false;
    $("soundBtn").setAttribute("aria-pressed", String(game.settings.sound));
    $("soundBtn").title = game.settings.sound
      ? "Mute sound effects"
      : "Enable sound effects";
    $("soundIcon").className =
      `app-icon icon-sound-${game.settings.sound ? "on" : "off"}`;
    $("gameMode").textContent = state.words.length
      ? `${state.mode === "expert" ? "Expert" : "Classic"} Mode`
      : dateText({
          weekday: "short",
          month: "short",
          day: "numeric",
        }).toUpperCase();
    $("scoreCluster").hidden = state.words.length === 0;
    $("liveScore").textContent = game.score;
    $("runTimer").hidden = !game.settings.showTimer || !state.timeKnown;
    $("runTimer").textContent = timeText();
    $("gameMascot").src =
      `assets/demo/cat-${state.status === "won" ? "winning" : state.words.length + state.revealedWords.length >= 3 ? "lying" : "sitting"}.webp`;
    $("keyboard").hidden = terminal;
    document.querySelector(".demo-controls").hidden = terminal;
    document.querySelector(".game-feedback").hidden =
      terminal && state.status !== "failed";
    $("hintBtn").hidden =
      terminal || state.mode !== "classic" || state.words.length < 3;
    $("hintBtn").disabled = busy || !game.canHint;
    $("expertStatus").hidden = state.mode !== "expert" || terminal;
    $("expertStatus").textContent =
      `${3 - state.invalidWords.length} invalid ${state.invalidWords.length === 2 ? "word" : "words"} remaining`;
    $("shuffleBtn").disabled = terminal || busy;
    $("deleteBtn").disabled = terminal || busy || !state.entry;
    $("endActionBtn").disabled = false;
    const reset = ["won", "revealed"].includes(state.status);
    $("endActionBtn").setAttribute(
      "aria-label",
      reset ? "Reset game" : "Reveal solution",
    );
    $("endActionIcon").className =
      `app-icon icon-${reset ? "reset" : "reveal"}`;
    $("definitionPrompt").hidden =
      !terminal || (!state.words.length && !state.revealedWords.length);
    $("definitionPanel").hidden = !terminal || !selectedWord;
    $("viewResultsBtn").hidden = state.status !== "won";
    renderWords();
    renderEntry();
  }
  function normalMessage() {
    const state = game.state;
    if (state.status === "failed")
      return message(
        "Three invalid words. Reveal the solution to explore the answers.",
        "error",
      );
    if (state.status === "won") return message("Well done! Five words found.");
    if (state.status === "revealed") return message("Solution revealed.");
    const count = state.words.length;
    message(
      count === 0
        ? "Find five words using all five letters."
        : count === 4
          ? "Cheers! · 1 more to go"
          : count === 3
            ? "Find 2 more words"
            : `Nice job! ${count} of 5 words needed to win`,
    );
  }
  const pause = (ms) =>
    new Promise((resolve) => setTimeout(resolve, reducedMotion() ? 0 : ms));
  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    const done = animation.finished
      .then(
        () => true,
        (error) => {
          if (error.name !== "AbortError") throw error;
          return false;
        },
      )
      .finally(() => {
        activeAnimations.delete(animation);
        animation.cancel();
      });
    return { animation, done };
  }
  function cancelLetterFlights(column) {
    for (const [index, flight] of letterFlights) {
      if (column !== undefined && index !== column) continue;
      flight.animation.cancel();
      flight.element.remove();
      letterFlights.delete(index);
    }
  }
  function cancelVisuals() {
    cancelLetterFlights();
    activeAnimations.forEach((animation) => animation.cancel());
    $("entryRow").classList.remove("accepted", "invalid", "special");
  }
  async function submit() {
    if (busy || game.state.entry.length !== 5) return;
    tick();
    busy = true;
    const token = generation;
    const word = game.state.entry;
    const hints = [...game.state.entryHints];
    renderEntry();
    // The final keyboard letter must land before validation and liquid fill.
    await Promise.all([...letterFlights.values()].map((flight) => flight.done));
    await pause(80);
    if (token !== generation) return;
    const result = game.submit();
    save();
    if (result.type === "accepted") {
      playSound(result.won ? "win-sound" : "valid");
      $("entryRow").classList.toggle(
        "special",
        game.puzzle.specialWords.includes(word),
      );
      $("entryRow").classList.add("accepted");
      renderEntry(word, hints);
      $("scoreFloat").textContent = `+${result.points}`;
      $("scoreFloat").hidden = false;
      await pause(640);
      if (token !== generation) return;
      const start = $("entryRow").getBoundingClientRect();
      $("entryRow").classList.remove("accepted", "special");
      render();
      const newest = $("discoveredWords").lastElementChild;
      if (newest && !reducedMotion()) {
        const end = newest.getBoundingClientRect();
        const movement = { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" };
        // Keep glyphs at the entry font size while the large tiles shrink.
        const entryFont = parseFloat(getComputedStyle(entryTiles[0]).fontSize);
        const letters = [...newest.querySelectorAll("button > span")].map(
          (tile) =>
            animate(
              tile,
              [
                { fontSize: `${(entryFont * end.height) / start.height}px` },
                { fontSize: getComputedStyle(tile).fontSize },
              ],
              movement,
            ).done,
        );
        const flight = animate(
          newest,
          [
            {
              transform: `translate(${start.left + start.width / 2 - end.left - end.width / 2}px, ${start.top + start.height / 2 - end.top - end.height / 2}px) scale(${start.width / end.width}, ${start.height / end.height})`,
            },
            { transform: "none" },
          ],
          movement,
        ).done;
        await Promise.all([flight, ...letters]);
      }
      if (token !== generation) return;
      busy = false;
      render();
      normalMessage();
      setTimeout(() => {
        if (token === generation) $("scoreFloat").hidden = true;
      }, 1000);
      if (result.won) {
        burst();
        setTimeout(
          () => {
            if (
              token === generation &&
              game.state.status === "won" &&
              !document.querySelector("dialog[open]")
            )
              showResults();
          },
          reducedMotion() ? 100 : 1500,
        );
      }
    } else {
      playSound("invalid");
      renderEntry(word, hints);
      $("entryRow").classList.add("invalid");
      message(result.message, "error");
      await pause(480);
      if (token !== generation) return;
      $("entryRow").classList.remove("invalid");
      busy = false;
      render();
      if (game.state.status === "failed") normalMessage();
    }
  }
  function flyLetter(index, column) {
    if (reducedMotion()) return;
    const from = keyButtons[index].getBoundingClientRect();
    const to = entryTiles[column].getBoundingClientRect();
    const letter = document.createElement("span");
    letter.className = "flight-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = game.state.letters[index];
    Object.assign(letter.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      color: getComputedStyle(board).getPropertyValue("--game-letter"),
    });
    document.body.append(letter);
    const flight = animate(
      letter,
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`,
          opacity: 1,
        },
      ],
      { duration: 360, easing: "cubic-bezier(.2,.75,.3,1)" },
    );
    const record = { ...flight, element: letter };
    letterFlights.set(column, record);
    record.done = flight.done.then(() => {
      letter.remove();
      if (letterFlights.get(column) === record) {
        letterFlights.delete(column);
        renderEntry();
      }
    });
  }
  async function shuffle() {
    if (!game || busy || game.state.status !== "playing") return;
    const token = generation;
    cancelLetterFlights();
    busy = true;
    render();
    playSound("shuffle");
    if (!reducedMotion()) {
      await Promise.all(
        keyButtons.map(
          (key) =>
            animate(
              key,
              [
                { transform: "perspective(400px) rotateX(0deg)" },
                { transform: "perspective(400px) rotateX(180deg)" },
              ],
              { duration: 170, easing: "ease-in", fill: "forwards" },
            ).done,
        ),
      );
      if (token !== generation) return;
    }
    game.shuffle();
    renderEntry();
    save();
    if (!reducedMotion()) {
      await Promise.all(
        keyButtons.map(
          (key) =>
            animate(
              key,
              [
                { transform: "perspective(400px) rotateX(180deg)" },
                { transform: "perspective(400px) rotateX(360deg)" },
              ],
              { duration: 230, easing: "ease-out" },
            ).done,
        ),
      );
      if (token !== generation) return;
    }
    busy = false;
    render();
  }
  function addLetter(index) {
    if (
      !game ||
      busy ||
      document.querySelector("dialog[open]") ||
      !game.addLetter(index)
    )
      return;
    playSound("pop");
    flyLetter(index, game.state.entry.length - 1);
    renderEntry();
    $("deleteBtn").disabled = false;
    save();
    if (game.state.entry.length === 5) submit();
  }
  function deleteLetter() {
    if (!game || busy || !game.deleteLetter()) return;
    cancelLetterFlights(game.state.entry.length);
    renderEntry();
    $("deleteBtn").disabled = !game.state.entry;
    save();
  }
  function openDialog(dialog) {
    tick();
    returnFocus = document.activeElement;
    dialog.showModal();
    lastTick = Date.now();
  }
  function closeDialog(dialog) {
    dialog.close();
  }
  function showDefinition(word) {
    if (game.state.status === "playing") return;
    selectedWord = word;
    const heading = document.createElement("h3");
    heading.textContent = word;
    const label = document.createElement("p");
    label.className = "definition-label";
    label.textContent = "Definition";
    const paragraphs = (game.puzzle.definitions[word] || []).map(
      (text, index) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = index ? `Also: ${text}` : text;
        return paragraph;
      },
    );
    $("definitionPanel").replaceChildren(heading, label, ...paragraphs);
    render();
  }
  function showResults() {
    if (game.state.status !== "won") return;
    $("winDate").textContent = game.puzzle.date
      ? `Game Date: ${dateText({ month: "numeric", day: "numeric", year: "numeric" })}`
      : "Practice Puzzle";
    $("winScore").textContent = game.score;
    $("winRunLabel").textContent = game.state.isReplay
      ? "Replay · Browser Demo"
      : "Browser Demo";
    $("winTime").textContent = game.state.timeKnown
      ? `Solved in ${timeText()}`
      : "Solve time unavailable for this older demo";
    $("winBreakdown").replaceChildren();
    game.breakdown.forEach(({ label, points }) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const value = document.createElement("dd");
      value.dataset.negative = String(points < 0);
      value.textContent = `${points >= 0 ? "+" : "−"}${Math.abs(points)}`;
      $("winBreakdown").append(term, value);
    });
    $("winSolutions").textContent =
      `You found 5 of ${game.puzzle.words.length} valid solutions`;
    $("winWords").replaceChildren();
    [
      ...game.state.words,
      ...game.puzzle.words.filter((word) => !game.state.words.includes(word)),
    ].forEach((word) => {
      const item = document.createElement("li");
      const heading = document.createElement("div");
      heading.className = "win-word-heading";
      heading.setAttribute("aria-label", word);
      for (const letter of word) {
        const tile = document.createElement("span");
        tile.textContent = letter;
        tile.setAttribute("aria-hidden", "true");
        heading.append(tile);
      }
      const text = document.createElement("p");
      text.textContent = game.puzzle.definitions[word].join(" ");
      item.append(heading, text);
      $("winWords").append(item);
    });
    $("shareResultsBtn").disabled = true;
    openDialog($("winDialog"));
  }
  function confirmAction(action) {
    pendingAction = action;
    $("confirmTitle").textContent =
      action === "reveal" ? "Reveal Solution?" : "Reset Game?";
    $("confirmText").textContent =
      action === "reveal"
        ? "This ends your run without a win and reveals the remaining answers. Your first result will be retained."
        : "Start this practice puzzle again? Your first completed result is retained. Replays do not change it.";
    $("confirmActionBtn").textContent =
      action === "reveal" ? "Reveal solution" : "Reset game";
    openDialog($("confirmDialog"));
  }
  function resetRun() {
    tick();
    generation++;
    cancelVisuals();
    busy = false;
    selectedWord = null;
    $("entryRow").classList.remove("accepted", "invalid");
    $("scoreFloat").hidden = true;
    game.reset();
    render();
    normalMessage();
    save();
    board.focus();
  }
  function burst() {
    if (reducedMotion()) return;
    const canvas = $("confettiLayer");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = board.clientWidth;
    canvas.height = board.clientHeight;
    const token = generation;
    const colors = ["#ff4056", "#26d1b2", "#ffd15a", "#8c7eff"];
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      speed: 2 + Math.random() * 3,
      angle: Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const started = performance.now();
    function frame(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (token !== generation || now - started > 2200 || reducedMotion())
        return;
      particles.forEach((particle) => {
        particle.y += particle.speed;
        particle.angle += 0.03;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.angle);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-3, -5, 6, 10);
        ctx.restore();
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  for (let index = 0; index < 5; index++) {
    const tile = document.createElement("span");
    tile.className = "entry-tile";
    tile.setAttribute("aria-hidden", "true");
    entryTiles.push(tile);
    $("entryRow").append(tile);
    const key = document.createElement("button");
    key.type = "button";
    key.className = "demo-key";
    key.addEventListener("click", () => addLetter(index));
    keyButtons.push(key);
    $("keyboard").append(key);
  }
  $("hintBtn").addEventListener("click", () => {
    if (busy) return;
    const previousUses = game.state.hintUses;
    if (!game.hint()) return;
    cancelLetterFlights();
    render();
    message(
      game.state.hintUses === previousUses
        ? "Hint restored · no additional points deducted"
        : "Two letters supplied · −10 points",
    );
    save();
    board.focus({ preventScroll: true });
  });
  $("shuffleBtn").addEventListener("click", shuffle);
  $("deleteBtn").addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.currentTarget.disabled) return;
    deleteLetter();
    deleteDelay = setTimeout(() => {
      deleteRepeat = setInterval(deleteLetter, 300);
    }, 400);
  });
  function stopDelete() {
    clearTimeout(deleteDelay);
    clearInterval(deleteRepeat);
  }
  window.addEventListener("pointerup", stopDelete);
  window.addEventListener("pointercancel", stopDelete);
  window.addEventListener("blur", stopDelete);
  $("deleteBtn").addEventListener("click", (event) => {
    if (event.detail === 0) deleteLetter();
  });
  board.addEventListener("keydown", (event) => {
    if (
      !game ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      document.querySelector("dialog[open]")
    )
      return;
    if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      const used = game.usedIndices;
      const index = game.state.letters.findIndex(
        (letter, i) => letter === event.key.toUpperCase() && !used.includes(i),
      );
      if (index >= 0) addLetter(index);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      deleteLetter();
    } else if (event.key === " " && event.target === board) {
      event.preventDefault();
      shuffle();
    }
  });
  document
    .querySelectorAll("[data-close-dialog]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        closeDialog(button.closest("dialog")),
      ),
    );
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      lastTick = Date.now();
      if (
        returnFocus?.isConnected &&
        !returnFocus.disabled &&
        returnFocus.getClientRects().length
      )
        returnFocus.focus({ preventScroll: true });
      else $("endActionBtn").focus({ preventScroll: true });
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          closeDialog(dialog);
      }
    });
  });
  $("soundBtn").addEventListener("click", () => {
    game.settings.sound = !game.settings.sound;
    if (game.settings.sound) playSound("pop");
    else sounds.forEach((sound) => sound.pause());
    $("soundBtn").setAttribute("aria-pressed", String(game.settings.sound));
    $("soundBtn").title = game.settings.sound
      ? "Mute sound effects"
      : "Enable sound effects";
    $("soundIcon").className =
      `app-icon icon-sound-${game.settings.sound ? "on" : "off"}`;
    save();
  });
  systemTheme.addEventListener("change", () => {
    if (game) appearance();
  });
  $("endActionBtn").addEventListener("click", () =>
    confirmAction(
      ["won", "revealed"].includes(game.state.status) ? "reset" : "reveal",
    ),
  );
  document.querySelectorAll("[data-reset-button]").forEach((button) =>
    button.addEventListener("click", () => {
      if (game) confirmAction("reset");
    }),
  );
  $("confirmActionBtn").addEventListener("click", () => {
    returnFocus = board;
    closeDialog($("confirmDialog"));
    if (pendingAction === "reset") resetRun();
    else {
      generation++;
      cancelVisuals();
      busy = false;
      game.reveal();
      render();
      normalMessage();
      save();
      board.focus({ preventScroll: true });
    }
  });
  $("viewResultsBtn").addEventListener("click", showResults);
  $("definitionPrompt").addEventListener("click", () => {
    const first = $("discoveredWords").querySelector("button");
    if (first) {
      showDefinition(first.dataset.word);
      $("discoveredWords").querySelector("button").focus();
    }
  });
  $("playAgainBtn").addEventListener("click", () => {
    closeDialog($("winDialog"));
    confirmAction("reset");
  });
  document.addEventListener("visibilitychange", () => {
    // Time before backgrounding still belongs to the active run.
    const now = Date.now();
    if (game && document.hidden) {
      if (boardVisible && !document.querySelector("dialog[open]"))
        game.tick(Math.max(0, now - lastTick));
      game.state.oneShot = false;
      save();
    }
    lastTick = now;
  });
  window.addEventListener("pagehide", () => {
    tick();
    save();
  });
  async function load(fresh = false) {
    $("loadError").hidden = true;
    try {
      if (!puzzleData) {
        const response = await fetch("assets/demo/puzzles.json");
        if (!response.ok)
          throw new Error(
            `Puzzle download failed (${response.status}). Please try again.`,
          );
        puzzleData = await response.json();
      }
      let saved = null,
        legacy = null;
      if (!fresh) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          blockedKey = raw !== null ? STORAGE_KEY : LEGACY_KEY;
          const legacyRaw =
            raw === null ? localStorage.getItem(LEGACY_KEY) : null;
          saved = raw === null ? null : JSON.parse(raw);
          legacy = legacyRaw === null ? null : JSON.parse(legacyRaw);
        } catch (error) {
          if (error instanceof SyntaxError)
            throw new Error(
              "Your saved demo could not be read. It has not been overwritten.",
            );
          storageFailure = true;
          notice(
            "Browser storage is unavailable. This demo will work for this visit, but progress cannot be saved.",
          );
        }
      }
      game = new window.ViisiDemoGame(puzzleData, saved, legacy);
      lastTick = Date.now();
      render();
      normalMessage();
      save();
      if (game.state.status === "playing" && game.state.entry.length === 5)
        submit();
    } catch (error) {
      $("loadError").hidden = false;
      $("loadErrorText").textContent = error.message;
      $("freshStartBtn").hidden = !puzzleData || storageFailure;
      message("The game could not load. See the message above.", "error");
    }
  }
  $("retryLoadBtn").addEventListener("click", () => load());
  $("freshStartBtn").addEventListener("click", async () => {
    try {
      const raw = localStorage.getItem(blockedKey);
      if (raw !== null)
        localStorage.setItem(`${blockedKey}.backup.${Date.now()}`, raw);
      await load(true);
    } catch {
      $("loadErrorText").textContent =
        "The saved game could not be backed up, so it has not been replaced. Check your browser's storage settings and try again.";
    }
  });
  new IntersectionObserver(([entry]) => {
    tick();
    boardVisible = entry.isIntersecting;
    lastTick = Date.now();
  }).observe(board);
  setInterval(() => {
    tick();
    if (Date.now() - timerSave >= 10000) {
      save();
      timerSave = Date.now();
    }
  }, 1000);
  await load();
})();
