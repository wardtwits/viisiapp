(() => {
  const STORAGE_KEY = "viisi.web.demo.v1";
  const REQUIRED_WORDS = 5;

  const PUZZLE = {
    letters: ["S", "L", "E", "A", "T"],
    validWords: [
      "LEAST",
      "LEATS",
      "SALET",
      "SETAL",
      "SLATE",
      "STALE",
      "STEAL",
      "STELA",
      "TAELS",
      "TALES",
      "TEALS",
      "TESLA",
    ],
  };

  const validWordSet = new Set(PUZZLE.validWords);

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
    resetBtn: document.getElementById("resetBtn"),
  };

  if (!elements.board || !elements.keyboard) {
    return;
  }

  const initialState = {
    displayLetters: [...PUZZLE.letters],
    completedWords: [],
    currentWord: "",
    currentIndices: [],
    hintUses: 0,
    hintMessage: "",
    lastMessage: "Build a 5-letter word using each tile once.",
    lastTone: "neutral",
    isWon: false,
    invalidFlash: false,
  };

  let state = loadState();
  let flashTimeoutId = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...initialState };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.displayLetters) || parsed.displayLetters.length !== 5) {
        return { ...initialState };
      }
      if (!Array.isArray(parsed.completedWords) || parsed.completedWords.length > REQUIRED_WORDS) {
        return { ...initialState };
      }
      if (typeof parsed.currentWord !== "string" || parsed.currentWord.length > 5) {
        return { ...initialState };
      }
      if (!Array.isArray(parsed.currentIndices) || parsed.currentIndices.length > 5) {
        return { ...initialState };
      }
      return {
        ...initialState,
        ...parsed,
        invalidFlash: false,
      };
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

        elements.board.appendChild(cell);
      }
    }
  }

  function canUseIndex(index) {
    return !state.currentIndices.includes(index) && state.currentWord.length < 5 && !state.isWon && !state.invalidFlash;
  }

  function renderKeyboard() {
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

    elements.deleteBtn.disabled = state.currentWord.length === 0 || state.isWon || state.invalidFlash;
    elements.shuffleBtn.disabled = state.isWon || state.invalidFlash;
    elements.hintBtn.disabled = !canUseHint() || state.invalidFlash;
  }

  function renderMeta() {
    elements.foundCount.textContent = `${state.completedWords.length} / ${REQUIRED_WORDS}`;
    elements.hintCount.textContent = String(state.hintUses);

    elements.foundWords.innerHTML = "";
    state.completedWords.forEach((word) => {
      const chip = document.createElement("span");
      chip.className = "found-word";
      chip.textContent = word;
      elements.foundWords.appendChild(chip);
    });

    elements.message.textContent = state.lastMessage;
    elements.message.classList.remove("is-error", "is-success");
    if (state.lastTone === "error") {
      elements.message.classList.add("is-error");
    } else if (state.lastTone === "success") {
      elements.message.classList.add("is-success");
    }

    if (state.hintMessage) {
      elements.hintBox.hidden = false;
      elements.hintText.textContent = state.hintMessage;
    } else {
      elements.hintBox.hidden = true;
      elements.hintText.textContent = "";
    }
  }

  function renderWordBank() {
    elements.wordBank.textContent = PUZZLE.validWords.join(" · ");
  }

  function render() {
    renderBoard();
    renderKeyboard();
    renderMeta();
    persistState();
  }

  function addLetter(index) {
    if (!canUseIndex(index)) return;
    state.currentWord += state.displayLetters[index];
    state.currentIndices.push(index);
    setMessage("Keep going.");
    render();

    if (state.currentWord.length === 5) {
      validateAttempt();
    }
  }

  function clearCurrentAttempt() {
    state.currentWord = "";
    state.currentIndices = [];
  }

  function deleteLetter() {
    if (state.currentWord.length === 0 || state.isWon || state.invalidFlash) return;
    state.currentWord = state.currentWord.slice(0, -1);
    state.currentIndices.pop();
    setMessage("Letter removed.");
    render();
  }

  function shuffleLetters() {
    if (state.isWon || state.invalidFlash) return;
    if (state.currentWord.length > 0) {
      setMessage("Finish or clear the current row before shuffling.", "error");
      render();
      return;
    }

    for (let i = state.displayLetters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.displayLetters[i], state.displayLetters[j]] = [state.displayLetters[j], state.displayLetters[i]];
    }

    setMessage("Letters shuffled.");
    render();
  }

  function validateAttempt() {
    const guess = state.currentWord;

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
    clearCurrentAttempt();

    if (state.completedWords.length >= REQUIRED_WORDS) {
      state.isWon = true;
      setMessage("You solved the demo. Nice run.", "success");
    } else {
      setMessage(`Nice. ${REQUIRED_WORDS - state.completedWords.length} more to win.`, "success");
    }

    render();
  }

  function canUseHint() {
    return state.completedWords.length >= 3 && state.hintUses < 2 && !state.isWon;
  }

  function useHint() {
    if (!canUseHint() || state.invalidFlash) return;

    const remaining = PUZZLE.validWords.filter((word) => !state.completedWords.includes(word));
    if (remaining.length === 0) return;

    const target = remaining[0];
    const revealCount = state.hintUses === 0 ? 2 : 3;
    const hintWord = `${target.slice(0, revealCount)}${"_".repeat(5 - revealCount)}`;

    state.hintUses += 1;
    state.hintMessage = `Try: ${hintWord}`;
    setMessage(`Hint ${state.hintUses} unlocked.`, "success");
    render();
  }

  function resetGame() {
    clearTimeout(flashTimeoutId);
    state = {
      ...initialState,
      displayLetters: [...PUZZLE.letters],
      lastMessage: "New demo run started.",
    };
    render();
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
    if (event.defaultPrevented || state.isWon || state.invalidFlash) return;
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

  elements.shuffleBtn.addEventListener("click", shuffleLetters);
  elements.deleteBtn.addEventListener("click", deleteLetter);
  elements.hintBtn.addEventListener("click", useHint);
  elements.resetBtn.addEventListener("click", resetGame);
  document.addEventListener("keydown", handleKeydown);

  renderWordBank();
  render();
})();
