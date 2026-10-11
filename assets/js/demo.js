(() => {
  const STORAGE_KEY = "viisi.web.demo.v4";
  const LEGACY_STORAGE_KEYS = ["viisi.web.demo.v1", "viisi.web.demo.v2", "viisi.web.demo.v3"];
  const REQUIRED_WORDS = 5;
  const POINTS_PER_WORD = 20;
  const COMPLETION_BONUS = 20;
  const HINT_PENALTY = 10;
  const prefersReducedMotion = Boolean(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const animationShell = document.querySelector(".phone-shell, .demo-shell");

  const PUZZLE = {
    letters: ["E", "A", "S", "T", "R"],
    validWords: [
      "STARE",
      "TEARS",
      "RATES",
      "ASTER",
      "TARES"
    ],
  };

  const validWordSet = new Set(PUZZLE.validWords);

  const DEFINITIONS = {
    STARE: "To look fixedly with the eyes wide open.",
    TEARS: "(plural of Tear) Drops of salty fluid from the eyes.",
    RATES: "(plural of Rate) Measures of speed or frequency.",
    ASTER: "A plant with daisy-like flowers.",
    TARES: "(plural of Tare) The weight of a container, deducted from the total."
    };

  const elements = {
    board: document.getElementById("board"),
    keyboard: document.getElementById("keyboard"),
    message: document.getElementById("message"),
    foundWords: document.getElementById("foundWords"),
    foundCount: document.getElementById("foundCount"),
    hintCount: document.getElementById("hintCount"),
    hintBox: document.getElementById("hintBox"),
    hintText: document.getElementById("hintText"),
    wordBank: document.getElementById("wordBank"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    deleteBtn: document.getElementById("deleteBtn"),
    hintBtn: document.getElementById("hintBtn"),
    resetButtons: document.querySelectorAll("[data-reset-button], #resetBtn"),
    liveScore: document.getElementById("liveScore"),
  };

  if (!elements.board || !elements.keyboard) {
    return;
  }

  // Keep hint hidden on first paint even if markup/cache is stale.
  if (elements.hintBtn) {

        elements.hintBtn.classList.add("invisible");
  
    // elements.hintBtn.hidden = true;
    // elements.hintBtn.style.display = "none";
  }

  function installIOSDoubleTapZoomGuard() {
    const isIOS =
      /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    if (!isIOS) return;

    const gameSurface = document.querySelector(".demo-main");
    if (!gameSurface) return;

    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    gameSurface.addEventListener(
      "touchend",
      (event) => {
        if (event.changedTouches.length !== 1) return;

        const touch = event.changedTouches[0];
        const now = event.timeStamp;
        const movedTooFar =
          Math.abs(touch.clientX - lastTapX) > 24 || Math.abs(touch.clientY - lastTapY) > 24;
        const isDoubleTap = now - lastTapTime < 320 && !movedTooFar;

        if (isDoubleTap) {
          event.preventDefault();

          if (event.target instanceof Element) {
            const interactiveTarget = event.target.closest("button, a, [role='button']");
            if (interactiveTarget instanceof HTMLElement) {
              interactiveTarget.click();
            }
          }
        }

        lastTapTime = now;
        lastTapX = touch.clientX;
        lastTapY = touch.clientY;
      },
      { passive: false }
    );
  }

  installIOSDoubleTapZoomGuard();

  const initialState = {
    displayLetters: [...PUZZLE.letters],
    completedWords: [],
    currentWord: "",
    currentIndices: [],
    hintUses: 0,
    hintRowsUsed: [],
    hintMessage: "",
    lastMessage: "Build a 5-letter word using each tile once.",
    lastTone: "neutral",
    isWon: false,
    invalidFlash: false,
  };

  let state = loadState();
  let flashTimeoutId = null;
  let submitTimeoutId = null;
  let winDelayTimeoutId = null;
  let pendingSubmit = false; // a full row is waiting for its tile to land before validating
  let lockingRow = -1; // row that just locked in, so renderBoard can pop it once
  const arrivingCells = new Set(); // "row:col" cells hidden while a tile flies in
  const gameStartTime = Date.now();

  function clearAllDemoStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(legacyKey);
      }

      // Clear any future demo versions too.
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith("viisi.web.demo.")) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage failures and continue with in-memory reset.
    }
  }

  function triggerWinAnimation() {
    if (!animationShell) return;
    animationShell.classList.remove("win");
    void animationShell.offsetWidth; // restart animation
    animationShell.classList.add("win");
    setTimeout(() => animationShell.classList.remove("win"), 1300);
  }

  function normalizeLoadedState(parsed) {
    const normalized = { ...initialState };

    if (Array.isArray(parsed.displayLetters) && parsed.displayLetters.length === 5) {
      normalized.displayLetters = parsed.displayLetters
        .map((letter) => String(letter).slice(0, 1).toUpperCase())
        .filter((letter) => /^[A-Z]$/.test(letter));
      // Saved letters must be a shuffle of today's puzzle letters.
      const sameLetters =
        [...normalized.displayLetters].sort().join("") === [...PUZZLE.letters].sort().join("");
      if (normalized.displayLetters.length !== 5 || !sameLetters) {
        normalized.displayLetters = [...PUZZLE.letters];
      }
    }

    if (Array.isArray(parsed.completedWords)) {
      const uniqueValidWords = [];
      for (const word of parsed.completedWords) {
        const candidate = String(word).toUpperCase();
        if (validWordSet.has(candidate) && !uniqueValidWords.includes(candidate)) {
          uniqueValidWords.push(candidate);
        }
        if (uniqueValidWords.length === REQUIRED_WORDS) {
          break;
        }
      }
      normalized.completedWords = uniqueValidWords;
    }

    if (typeof parsed.currentWord === "string") {
      const candidate = parsed.currentWord.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
      normalized.currentWord = candidate;
    }

    if (Array.isArray(parsed.currentIndices)) {
      const candidate = parsed.currentIndices
        .map((index) => Number(index))
        .filter((index) => Number.isInteger(index) && index >= 0 && index < 5);
      const unique = [...new Set(candidate)];
      normalized.currentIndices = unique.slice(0, 5);
    }

    if (
      normalized.currentWord.length !== normalized.currentIndices.length ||
      normalized.currentWord.length + normalized.completedWords.length > REQUIRED_WORDS
    ) {
      normalized.currentWord = "";
      normalized.currentIndices = [];
    }

    if (typeof parsed.hintUses === "number") {
      normalized.hintUses = Math.max(0, Math.min(2, Math.floor(parsed.hintUses)));
    }

    if (Array.isArray(parsed.hintRowsUsed)) {
      const uniqueRows = [];
      for (const row of parsed.hintRowsUsed) {
        const candidate = Number(row);
        if (
          Number.isInteger(candidate) &&
          candidate >= 0 &&
          candidate < REQUIRED_WORDS &&
          !uniqueRows.includes(candidate)
        ) {
          uniqueRows.push(candidate);
        }
      }
      normalized.hintRowsUsed = uniqueRows;
    }

    if (typeof parsed.hintMessage === "string") {
      normalized.hintMessage = parsed.hintMessage.slice(0, 120);
    }

    if (typeof parsed.lastMessage === "string") {
      normalized.lastMessage = parsed.lastMessage.slice(0, 160);
    }

    if (parsed.lastTone === "error" || parsed.lastTone === "success" || parsed.lastTone === "neutral") {
      normalized.lastTone = parsed.lastTone;
    }

    normalized.isWon = normalized.completedWords.length >= REQUIRED_WORDS;
    if (normalized.isWon) {
      normalized.currentWord = "";
      normalized.currentIndices = [];
    }

    return normalized;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...initialState };
      const parsed = JSON.parse(raw);
      const normalized = normalizeLoadedState(parsed);
      return { ...normalized, invalidFlash: false };
    } catch {
      return { ...initialState };
    }
  }

  function persistState() {
    const save = {
      displayLetters: state.displayLetters,
      completedWords: state.completedWords,
      currentWord: state.currentWord,
      currentIndices: state.currentIndices,
      hintUses: state.hintUses,
      hintRowsUsed: state.hintRowsUsed,
      hintMessage: state.hintMessage,
      lastMessage: state.lastMessage,
      lastTone: state.lastTone,
      isWon: state.isWon,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Ignore storage write failures (private browsing/storage limits).
    }
  }

  function setMessage(text, tone = "neutral") {
    state.lastMessage = text;
    state.lastTone = tone;
  }

  function formatElapsedTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function currentScore() {
    const base = state.completedWords.length * POINTS_PER_WORD + (state.isWon ? COMPLETION_BONUS : 0);
    return Math.max(0, base - state.hintUses * HINT_PENALTY);
  }

  function currentRowIndex() {
    return Math.min(state.completedWords.length, REQUIRED_WORDS - 1);
  }

  function rowWord(row) {
    if (row < state.completedWords.length) {
      return state.completedWords[row];
    }
    if (row === state.completedWords.length && !state.isWon) {
      return state.currentWord;
    }
    return "";
  }

  function renderBoard() {
    elements.board.innerHTML = "";

    for (let row = 0; row < REQUIRED_WORDS; row += 1) {
      const word = rowWord(row);
      for (let col = 0; col < 5; col += 1) {
        const cell = document.createElement("div");
        cell.className = "demo-cell";
        cell.setAttribute("role", "gridcell");
        cell.textContent = word[col] ?? "";

        if (row < state.completedWords.length) {
          cell.classList.add("is-complete");
        }

        if (row === state.completedWords.length && !state.isWon) {
          cell.classList.add("is-active");
        }

        if (state.invalidFlash && row === currentRowIndex()) {
          cell.classList.add("is-invalid");
        }

        if (row === lockingRow) {
          cell.classList.add("is-locking");
          cell.style.animationDelay = `${col * 70}ms`;
        }

        if (arrivingCells.has(`${row}:${col}`)) {
          cell.classList.add("is-arriving");
        }

        elements.board.appendChild(cell);
      }
    }
    lockingRow = -1;
  }

  function canUseIndex(index) {
    return (
      !state.currentIndices.includes(index) &&
      state.currentWord.length < 5 &&
      !state.isWon &&
      !state.invalidFlash &&
      !pendingSubmit
    );
  }

  function renderKeyboard() {
    if (!elements.keyboard) return;
    elements.keyboard.innerHTML = "";

    state.displayLetters.forEach((letter, index) => {
      const key = document.createElement("button");
      key.type = "button";
      key.className = "demo-key";
      key.textContent = letter;
      key.disabled = !canUseIndex(index);
      key.addEventListener("click", () => addLetter(index));
      elements.keyboard.appendChild(key);
    });

    if (elements.deleteBtn) {
      elements.deleteBtn.disabled =
        state.currentWord.length === 0 || state.isWon || state.invalidFlash || pendingSubmit;
    }
    if (elements.shuffleBtn) {
      elements.shuffleBtn.disabled = state.isWon || state.invalidFlash || pendingSubmit;
    }
    if (elements.hintBtn) {
      const showHintButton = state.completedWords.length >= 3 && !state.isWon && state.hintUses < 2;
      const hintAvailable = canUseHint() && !state.invalidFlash && !pendingSubmit;
      if (showHintButton) {
        elements.hintBtn.classList.remove("invisible");
      } else {
        elements.hintBtn.classList.add("invisible");
      }
      elements.hintBtn.classList.toggle("is-disabled", showHintButton && !hintAvailable);
      elements.hintBtn.setAttribute("aria-disabled", String(showHintButton && !hintAvailable));
    }
  }

  function renderMeta() {
    if (elements.foundCount) {
      elements.foundCount.textContent = `${state.completedWords.length} / ${REQUIRED_WORDS}`;
    }
    if (elements.hintCount) {
      elements.hintCount.textContent = String(state.hintUses);
    }

    if (elements.foundWords) {
      elements.foundWords.innerHTML = "";
      state.completedWords.forEach((word) => {
        const chip = document.createElement("span");
        chip.className = "found-word";
        chip.textContent = word;
        elements.foundWords.appendChild(chip);
      });
    }

    if (elements.liveScore) {
      elements.liveScore.textContent = String(currentScore());
    }

    if (elements.message) {
      elements.message.textContent = state.lastMessage;
      elements.message.classList.remove("is-error", "is-success");
      if (state.lastTone === "error") {
        elements.message.classList.add("is-error");
      } else if (state.lastTone === "success") {
        elements.message.classList.add("is-success");
      }
    }

    if (elements.hintBox && elements.hintText) {
      if (state.hintMessage) {
        elements.hintBox.hidden = false;
        elements.hintText.textContent = state.hintMessage;
      } else {
        elements.hintBox.hidden = true;
        elements.hintText.textContent = "";
      }
    }
  }

  function renderWordBank() {
    if (elements.wordBank) {
      elements.wordBank.textContent = PUZZLE.validWords.join(" · ");
    }
  }

  function render() {
    renderBoard();
    renderKeyboard();
    renderMeta();
    persistState();
  }

  function flyTile(fromRect, row, col, letter) {
    const key = `${row}:${col}`;
    const finish = () => {
      arrivingCells.delete(key);
      const cell = elements.board.children[row * 5 + col];
      if (cell) {
        cell.classList.remove("is-arriving");
        cell.classList.add("is-landed");
      }
    };
    const cell = elements.board.children[row * 5 + col];
    if (!cell || typeof cell.animate !== "function") {
      finish();
      return;
    }

    const to = cell.getBoundingClientRect();
    const tile = document.createElement("div");
    tile.className = "flying-tile";
    tile.textContent = letter;
    tile.style.left = `${fromRect.left}px`;
    tile.style.top = `${fromRect.top}px`;
    tile.style.width = `${fromRect.width}px`;
    tile.style.height = `${fromRect.height}px`;
    document.body.appendChild(tile);

    const dx = to.left - fromRect.left;
    const dy = to.top - fromRect.top;
    const sx = to.width / fromRect.width;
    const sy = to.height / fromRect.height;
    const animation = tile.animate(
      [
        { transform: "translate(0, 0) scale(1, 1)" },
        {
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 18}px) scale(${(1 + sx) / 2}, ${(1 + sy) / 2})`,
          offset: 0.5,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      ],
      { duration: 260, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)", fill: "forwards" }
    );
    const done = () => {
      tile.remove();
      finish();
    };
    animation.addEventListener("finish", done, { once: true });
    animation.addEventListener("cancel", done, { once: true });
  }

  function addLetter(index) {
    if (!canUseIndex(index)) return;

    const row = state.completedWords.length;
    const col = state.currentWord.length;
    const letter = state.displayLetters[index];
    const keyEl = elements.keyboard.children[index];
    const fromRect = keyEl ? keyEl.getBoundingClientRect() : null;
    const animate = !prefersReducedMotion && Boolean(fromRect);

    state.currentWord += letter;
    state.currentIndices.push(index);
    setMessage("Keep going.");

    const isFull = state.currentWord.length === 5;
    if (isFull) pendingSubmit = true;
    if (animate) arrivingCells.add(`${row}:${col}`);
    render();
    if (animate) flyTile(fromRect, row, col, letter);

    if (isFull) {
      clearTimeout(submitTimeoutId);
      submitTimeoutId = window.setTimeout(
        () => {
          pendingSubmit = false;
          validateAttempt();
        },
        prefersReducedMotion ? 0 : 340
      );
    }
  }

  function clearCurrentAttempt() {
    state.currentWord = "";
    state.currentIndices = [];
  }

  function remapCurrentIndicesToShuffledLetters() {
    if (state.currentWord.length === 0) return true;

    const nextIndices = [];
    for (const letter of state.currentWord) {
      let nextIndex = null;
      for (let i = 0; i < state.displayLetters.length; i += 1) {
        if (state.displayLetters[i] === letter && !nextIndices.includes(i)) {
          nextIndex = i;
          break;
        }
      }
      if (nextIndex === null) {
        return false;
      }
      nextIndices.push(nextIndex);
    }

    state.currentIndices = nextIndices;
    return true;
  }

  function deleteLetter() {
    if (state.currentWord.length === 0 || state.isWon || state.invalidFlash || pendingSubmit) return;
    state.currentWord = state.currentWord.slice(0, -1);
    state.currentIndices.pop();
    setMessage("Letter removed.");
    render();
  }

  function getShuffledLettersAvoidingSolutions(letters) {
    const original = [...letters];
    const originalOrder = original.join("");
    const maxAttempts = 40;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = [...original];
      for (let i = candidate.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
      }

      const candidateOrder = candidate.join("");
      if (candidateOrder === originalOrder) continue;
      if (validWordSet.has(candidateOrder)) continue;
      return candidate;
    }

    // Deterministic fallback if random attempts were exhausted.
    for (let shift = 1; shift < original.length; shift += 1) {
      const candidate = original.slice(shift).concat(original.slice(0, shift));
      const candidateOrder = candidate.join("");
      if (candidateOrder === originalOrder) continue;
      if (validWordSet.has(candidateOrder)) continue;
      return candidate;
    }

    return original;
  }

  function shuffleLetters() {
    if (state.isWon || state.invalidFlash || pendingSubmit) return;
    const hasCurrentAttempt = state.currentWord.length > 0;
    const shuffled = getShuffledLettersAvoidingSolutions(state.displayLetters);
    const didChangeOrder = shuffled.join("") !== state.displayLetters.join("");
    state.displayLetters = shuffled;

    if (!remapCurrentIndicesToShuffledLetters()) {
      clearCurrentAttempt();
      setMessage("Letters shuffled. Current row was reset.", "error");
      render();
      return;
    }

    if (!didChangeOrder) {
      setMessage("Letters could not be shuffled right now.", "error");
      render();
      return;
    }

    setMessage(hasCurrentAttempt ? "Letters shuffled. Keep building your word." : "Letters shuffled.");
    render();
  }

  function validateAttempt() {
    const guess = state.currentWord.toUpperCase();
    if (guess.length !== 5) {
      setMessage("Word must be 5 letters.", "error");
      clearCurrentAttempt();
      render();
      return;
    }

    if (!validWordSet.has(guess)) {
      state.invalidFlash = true;
      setMessage(`"${guess}" is an invalid word.`, "error");
      render();

      clearTimeout(flashTimeoutId);
      flashTimeoutId = window.setTimeout(() => {
        state.invalidFlash = false;
        clearCurrentAttempt();
        render();
      }, 500);
      return;
    }

    if (state.completedWords.includes(guess)) {
      setMessage(`"${guess}" was already found.`, "error");
      clearCurrentAttempt();
      render();
      return;
    }

    state.completedWords.push(guess);
    lockingRow = state.completedWords.length - 1;
    clearCurrentAttempt();

    if (state.completedWords.length >= REQUIRED_WORDS) {
      state.isWon = true;
      triggerWinAnimation();
      setMessage("You solved the demo. Nice run.", "success");
      const result = {
        time: formatElapsedTime(Date.now() - gameStartTime),
        score: currentScore(),
        hints: state.hintUses,
        words: [...state.completedWords],
      };
      clearTimeout(winDelayTimeoutId);
      winDelayTimeoutId = window.setTimeout(() => showWin(result), prefersReducedMotion ? 0 : 750);
    } else {
      setMessage(`Nice. ${REQUIRED_WORDS - state.completedWords.length} more to win.`, "success");
    }

    render();
  }

  function canUseHint() {
    const row = currentRowIndex();
    const rowSupportsHint = row >= 3 && row < REQUIRED_WORDS;
    return rowSupportsHint && state.hintUses < 2 && !state.isWon && !state.hintRowsUsed.includes(row);
  }

  function useHint() {
    if (pendingSubmit) return;
    if (state.invalidFlash) {
      setMessage("Finish the current row reset, then try hint again.", "error");
      render();
      return;
    }

    if (!canUseHint()) {
      if (state.hintUses >= 2) {
        setMessage("No hints remaining for this demo run.", "error");
      } else if (state.completedWords.length < 3) {
        setMessage("Hints unlock after you find 3 words.", "error");
      } else if (state.hintRowsUsed.includes(currentRowIndex())) {
        setMessage("Hint already used on this row.", "error");
      } else {
        setMessage("Hint is not available right now.", "error");
      }
      render();
      return;
    }

    const remaining = PUZZLE.validWords.filter((word) => !state.completedWords.includes(word));
    if (remaining.length === 0) return;

    const groupsByPrefix = new Map();
    for (const word of remaining) {
      const prefix = word.slice(0, 2);
      if (!groupsByPrefix.has(prefix)) {
        groupsByPrefix.set(prefix, []);
      }
      groupsByPrefix.get(prefix).push(word);
    }

    let bestPrefix = null;
    let bestGroup = [];
    for (const [prefix, words] of groupsByPrefix.entries()) {
      if (words.length > bestGroup.length) {
        bestPrefix = prefix;
        bestGroup = words;
      }
    }
    if (!bestPrefix || bestGroup.length === 0) return;

    const prefixLength = 2;
    const prefix = bestPrefix;
    const nextIndices = [];

    // Hint behavior mirrors Viisi: clear in-progress row before applying hint tiles.
    clearCurrentAttempt();

    for (let i = 0; i < prefix.length; i += 1) {
      const letter = prefix[i];
      let indexForLetter = null;
      for (let keyIndex = 0; keyIndex < state.displayLetters.length; keyIndex += 1) {
        if (state.displayLetters[keyIndex] === letter && !nextIndices.includes(keyIndex)) {
          indexForLetter = keyIndex;
          break;
        }
      }
      if (indexForLetter === null) {
        setMessage("Hint could not be applied. Try shuffling and retry.", "error");
        render();
        return;
      }
      nextIndices.push(indexForLetter);
    }

    state.currentWord = prefix;
    state.currentIndices = nextIndices;

    const hintedRow = currentRowIndex();
    if (!state.hintRowsUsed.includes(hintedRow)) {
      state.hintRowsUsed.push(hintedRow);
    }
    state.hintUses += 1;
    state.hintMessage = `Hint applied: ${prefix}${"_".repeat(5 - prefixLength)} (${bestGroup.length} possible word${bestGroup.length === 1 ? "" : "s"})`;
    setMessage(`Hint ${state.hintUses} applied. First two tiles filled.`, "success");
    render();
  }

  function resetGame() {
    clearTimeout(flashTimeoutId);
    clearTimeout(submitTimeoutId);
    clearTimeout(winDelayTimeoutId);
    flashTimeoutId = null;
    clearAllDemoStorage();

    state = {
      ...initialState,
      displayLetters: [...PUZZLE.letters],
    };
    render();

    // Hard-reset UX: always return to first-load state.
    window.location.reload();
  }

  function firstUnusedIndexForLetter(letter) {
    const target = letter.toUpperCase();
    for (let i = 0; i < state.displayLetters.length; i += 1) {
      if (state.displayLetters[i] === target && !state.currentIndices.includes(i)) {
        return i;
      }
    }
    return null;
  }

  function handleKeydown(event) {
    if (event.defaultPrevented || state.isWon || state.invalidFlash || pendingSubmit) return;
    const key = event.key.toUpperCase();

    if (key === "BACKSPACE") {
      event.preventDefault();
      deleteLetter();
      return;
    }

    if (key === " ") {
      event.preventDefault();
      shuffleLetters();
      return;
    }

    if (!/^[A-Z]$/.test(key)) return;

    const index = firstUnusedIndexForLetter(key);
    if (index !== null) {
      event.preventDefault();
      addLetter(index);
    }
  }

  if (elements.shuffleBtn) {
    elements.shuffleBtn.addEventListener("click", shuffleLetters);
  }
  if (elements.deleteBtn) {
    elements.deleteBtn.addEventListener("click", deleteLetter);
  }
  if (elements.hintBtn) {
    elements.hintBtn.addEventListener("click", useHint);
  }
  for (const resetButton of elements.resetButtons) {
    resetButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetGame();
    });
  }
  document.addEventListener("keydown", handleKeydown);

  const overlay = document.getElementById("winOverlay");
  const confettiLayer = document.getElementById("confettiLayer");
  const winTime = document.getElementById("winTime");
  const winScore = document.getElementById("winScore");
  const winDate = document.getElementById("winDate");
  const winWords = document.getElementById("winWords");
  const winStreak = document.getElementById("winStreak");
  const winCloseBtn = document.getElementById("winCloseBtn");
  const winReplayBtn = document.getElementById("winReplayBtn");
  let confettiBurstTimeoutId = null;

  let scoreFrameId = 0;

  function animateScore(target) {
    if (!winScore) return;
    cancelAnimationFrame(scoreFrameId);
    if (prefersReducedMotion) {
      winScore.textContent = String(target);
      return;
    }

    const startAt = performance.now() + 350;
    const duration = 900;
    winScore.textContent = "0";
    const tick = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startAt) / duration));
      winScore.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) scoreFrameId = requestAnimationFrame(tick);
    };
    scoreFrameId = requestAnimationFrame(tick);
  }

  function showWin({ time = "00:00", score = 0, hints = 0, words = [] } = {}) {
    if (!overlay) return;
    if (winTime) winTime.textContent = time;
    if (winStreak) {
      winStreak.textContent = hints > 0 ? `-${hints * HINT_PENALTY}` : "0";
      winStreak.classList.toggle("is-negative", hints > 0);
    }
    if (winDate) {
      winDate.textContent = new Date()
        .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
        .toUpperCase();
    }
    if (winWords) {
      winWords.innerHTML = "";
      words.forEach((word) => {
        const item = document.createElement("li");
        const title = document.createElement("strong");
        title.textContent = word;
        const meaning = document.createElement("span");
        meaning.textContent = DEFINITIONS[word] || "";
        item.append(title, meaning);
        winWords.appendChild(item);
      });
    }
    animateScore(score);
    const card = overlay.querySelector(".win-card");
    if (card) card.scrollTop = 0;

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");

    // kick open animation
    requestAnimationFrame(() => {
      overlay.classList.add("win-open");
      spawnConfetti(95);
    });
    clearTimeout(confettiBurstTimeoutId);
    confettiBurstTimeoutId = window.setTimeout(() => spawnConfetti(60), 220);

    if (winCloseBtn) winCloseBtn.focus({ preventScroll: true });

    // Esc closes
    window.addEventListener("keydown", escClose, { once: true });
  }

  function hideWin() {
    if (!overlay) return;
    overlay.classList.remove("win-open");
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    clearTimeout(confettiBurstTimeoutId);
    confettiBurstTimeoutId = null;
    // let transition finish
    setTimeout(() => {
      overlay.hidden = true;
      if (confettiLayer) confettiLayer.innerHTML = "";
    }, 220);
  }

  function replayWin() {
    if (!overlay) return;
    if (!confettiLayer) return;
    confettiLayer.innerHTML = "";
    overlay.classList.remove("win-open");
    requestAnimationFrame(() => {
      overlay.classList.add("win-open");
      spawnConfetti(95);
    });
    clearTimeout(confettiBurstTimeoutId);
    confettiBurstTimeoutId = window.setTimeout(() => spawnConfetti(60), 220);
  }

  function escClose(e) {
    if (e.key === "Escape") hideWin();
    else window.addEventListener("keydown", escClose, { once: true });
  }

  // Win animation

  function spawnConfetti(count = 80) {
    if (!confettiLayer) return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const colors = [
      "#10b981", // emerald
      "#f59e0b", // amber
      "#f43f5e", // rose
      "#3b82f6", // blue
      "#a78bfa", // violet
      "#22c55e"  // green
    ];
    const shapes = ["confetti--chip", "confetti--ribbon", "confetti--dot"];

    const w = confettiLayer.clientWidth || 520;
    const h = confettiLayer.clientHeight || 460;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti";
      el.style.left = Math.random() * w + "px";
      el.style.background = colors[(Math.random() * colors.length) | 0];
      el.classList.add(shapes[(Math.random() * shapes.length) | 0]);

      const width = (Math.random() * 8 + 6).toFixed(1) + "px";
      const height = (Math.random() * 12 + 8).toFixed(1) + "px";
      const radius = (Math.random() * 5 + 1).toFixed(1) + "px";

      const x0 = (Math.random() * 70 - 35).toFixed(1) + "px";
      const xBurst = (Math.random() * 240 - 120).toFixed(1) + "px";
      const xMid = (Math.random() * 340 - 170).toFixed(1) + "px";
      const x1 = (Math.random() * 460 - 230).toFixed(1) + "px";
      const rise = `-${(Math.random() * 125 + 40).toFixed(1)}px`;
      const drop = `${(h + Math.random() * 140 + 70).toFixed(1)}px`;
      const sway = (Math.random() * 12 + 6).toFixed(1) + "px";
      const rot = (Math.random() * 1320 - 660).toFixed(0) + "deg";
      const dur = (Math.random() * 900 + 1000).toFixed(0) + "ms";
      const swayDur = (Math.random() * 120 + 110).toFixed(0) + "ms";

      el.style.setProperty("--w", width);
      el.style.setProperty("--h", height);
      el.style.setProperty("--radius", radius);
      el.style.setProperty("--x0", x0);
      el.style.setProperty("--xBurst", xBurst);
      el.style.setProperty("--xMid", xMid);
      el.style.setProperty("--x1", x1);
      el.style.setProperty("--rise", rise);
      el.style.setProperty("--drop", drop);
      el.style.setProperty("--sway", sway);
      el.style.setProperty("--rot", rot);
      el.style.setProperty("--dur", dur);
      el.style.setProperty("--swayDur", swayDur);

      // stagger
      const waveDelay = (i / Math.max(1, count)) * 220;
      el.style.animationDelay = `${(Math.random() * 120 + waveDelay).toFixed(0)}ms, 0ms`;

      confettiLayer.appendChild(el);

      // cleanup
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  }

  // Expose globally
  window.showWin = showWin;
  window.hideWin = hideWin;
  window.replayWin = replayWin;

  if (winCloseBtn) {
    winCloseBtn.addEventListener("click", hideWin);
  }
  if (winReplayBtn) {
    winReplayBtn.addEventListener("click", replayWin);
  }
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.classList.contains("win-backdrop")) {
        hideWin();
      }
    });
  }

  // win animation ends here
  
  renderWordBank();
  render();
})();
