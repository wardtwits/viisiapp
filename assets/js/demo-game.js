(function (root) {
  "use strict";

  // Browser practice only. No native history, Game Center, or daily puzzle data
  // is written here. The UI consumes this single authoritative run state.
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const canonical = (word) => String(word).trim().toUpperCase();
  const statuses = new Set(["playing", "won", "revealed", "failed"]);
  const defaults = {
    appearance: "system",
    sound: true,
    showTimer: false,
    highContrast: false,
  };

  class DemoGame {
    constructor(data, saved = null, legacy = null) {
      this.data = data;
      if (
        saved !== null &&
        (typeof saved !== "object" || Array.isArray(saved))
      ) {
        throw new Error(
          "The saved demo contains invalid progress. It has not been overwritten.",
        );
      }
      if (legacy && !saved) saved = this.migrateLegacy(legacy);
      const puzzleId = saved?.puzzleId || data.defaultPuzzle;
      this.puzzle = data.puzzles.find((puzzle) => puzzle.id === puzzleId);
      if (!this.puzzle) throw new Error("The saved puzzle is unavailable.");
      this.settings = { ...defaults, ...saved?.settings };
      if (!["system", "light", "dark"].includes(this.settings.appearance))
        this.settings.appearance = "system";
      for (const key of ["sound", "showTimer", "highContrast"]) {
        if (typeof this.settings[key] !== "boolean")
          this.settings[key] = defaults[key];
      }
      this.state = saved ? this.restore(saved) : this.fresh();
    }

    fresh(mode = "classic", original = null) {
      return {
        puzzleId: this.puzzle.id,
        mode,
        letters: [...this.puzzle.letters],
        words: [],
        wordHints: [],
        entry: "",
        entryHints: [],
        hintedRows: [],
        hintUses: 0,
        invalidWords: [],
        status: "playing",
        revealedWords: [],
        elapsedMs: 0,
        timeKnown: true,
        modeLocked: false,
        original,
        isReplay: Boolean(original),
        oneShot: true,
      };
    }

    migrateLegacy(legacy) {
      if (!Array.isArray(legacy.completedWords))
        throw new Error("The saved demo cannot be read.");
      return {
        puzzleId: "legacy-eastr",
        mode: "classic",
        letters: legacy.displayLetters,
        words: legacy.completedWords,
        wordHints: legacy.completedWords.map(() => []),
        entry: legacy.currentWord || "",
        entryHints: [],
        hintedRows: legacy.hintRowsUsed || [],
        hintUses: legacy.hintUses || 0,
        invalidWords: [],
        status: legacy.completedWords.length === 5 ? "won" : "playing",
        elapsedMs: 0,
        timeKnown: false,
        modeLocked:
          legacy.completedWords.length > 0 || Boolean(legacy.currentWord),
        revealedWords: [],
        original: null,
        isReplay: false,
        oneShot: false,
      };
    }

    restore(saved) {
      const state = { ...this.fresh(), ...copy(saved) };
      const valid = new Set(this.puzzle.words);
      if (
        !statuses.has(state.status) ||
        !["classic", "expert"].includes(state.mode) ||
        !Array.isArray(state.letters) ||
        [...state.letters].sort().join("") !==
          [...this.puzzle.letters].sort().join("") ||
        !Array.isArray(state.words) ||
        state.words.length > 5 ||
        new Set(state.words).size !== state.words.length ||
        state.words.some((word) => !valid.has(word)) ||
        typeof state.entry !== "string" ||
        !this.isArrangement(state.entry) ||
        !Array.isArray(state.hintedRows) ||
        new Set(state.hintedRows).size !== state.hintedRows.length ||
        state.hintedRows.some(
          (row) => ![3, 4].includes(row) || row > state.words.length,
        ) ||
        state.hintUses !== state.hintedRows.length ||
        !Number.isFinite(state.elapsedMs) ||
        state.elapsedMs < 0 ||
        !Array.isArray(state.wordHints) ||
        !Array.isArray(state.entryHints) ||
        !Array.isArray(state.invalidWords) ||
        state.invalidWords.some(
          (word) =>
            typeof word !== "string" ||
            word.length !== 5 ||
            !this.isArrangement(word) ||
            valid.has(word),
        ) ||
        new Set(state.invalidWords).size !== state.invalidWords.length ||
        !Array.isArray(state.revealedWords) ||
        state.revealedWords.some(
          (word) => !valid.has(word) || state.words.includes(word),
        ) ||
        new Set(state.revealedWords).size !== state.revealedWords.length ||
        (state.status === "revealed" &&
          state.words.length + state.revealedWords.length !== 5) ||
        (state.status === "playing" && state.words.length === 5) ||
        (state.mode === "expert" && state.hintUses !== 0) ||
        (state.status === "won" && state.words.length !== 5)
      ) {
        throw new Error(
          "The saved demo contains invalid progress. It has not been overwritten.",
        );
      }
      state.wordHints = state.words.map((_, row) =>
        (state.wordHints[row] || []).filter(
          (column) => Number.isInteger(column) && column >= 0 && column < 5,
        ),
      );
      state.entryHints = state.entryHints.filter(
        (column) =>
          Number.isInteger(column) &&
          column >= 0 &&
          column < state.entry.length,
      );
      if (state.status !== "playing") state.entry = "";
      if (state.original) {
        if (
          state.original.puzzleId !== this.puzzle.id ||
          !statuses.has(state.original.status) ||
          state.original.status === "playing"
        ) {
          throw new Error(
            "The original saved result is invalid. It has not been overwritten.",
          );
        }
        const originalGame = new DemoGame(this.data, {
          ...state.original,
          original: null,
        });
        state.original = originalGame.record();
      }
      this.state = state;
      if (state.status !== "playing" && !state.original)
        state.original = this.record();
      return state;
    }

    isArrangement(word) {
      const letters = [...this.puzzle.letters];
      for (const letter of word) {
        const index = letters.indexOf(letter);
        if (index < 0) return false;
        letters.splice(index, 1);
      }
      return word.length <= 5;
    }

    get breakdown() {
      const state = this.state;
      const items = [
        {
          label: `${state.words.length} words × 20`,
          points: state.words.length * 20,
        },
      ];
      if (state.status === "won")
        items.push({ label: "Completion bonus", points: 20 });
      if (state.status === "won" && state.mode === "expert")
        items.push({ label: "Expert bonus", points: 30 });
      const specials = state.words.filter((word) =>
        this.puzzle.specialWords.includes(word),
      ).length;
      if (specials)
        items.push({
          label: `${specials} Special Word${specials > 1 ? "s" : ""}`,
          points: specials * 25,
        });
      if (state.hintUses)
        items.push({
          label: `${state.hintUses} hint${state.hintUses > 1 ? "s" : ""}`,
          points: -state.hintUses * 10,
        });
      return items;
    }

    get score() {
      return Math.max(
        0,
        this.breakdown.reduce((total, item) => total + item.points, 0),
      );
    }

    get usedIndices() {
      const used = [];
      for (const letter of this.state.entry) {
        const index = this.state.letters.findIndex(
          (candidate, i) => candidate === letter && !used.includes(i),
        );
        if (index >= 0) used.push(index);
      }
      return used;
    }

    get hintPrefix() {
      const candidates = this.puzzle.words.filter(
        (word) =>
          !this.state.words.includes(word) &&
          !this.puzzle.specialWords.includes(word),
      );
      const prefixCounts = new Map();
      for (const word of candidates) {
        const prefix = word.slice(0, 2);
        prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
      }
      return [...prefixCounts].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }

    get canHint() {
      const state = this.state;
      if (
        state.status !== "playing" ||
        state.mode !== "classic" ||
        state.words.length < 3
      )
        return false;
      if (!state.hintedRows.includes(state.words.length))
        return state.hintUses < 2;
      // A paid hint belongs to this row. Recall it after deletion or editing,
      // including after reload, without spending a second hint or more points.
      return (
        state.entry !== this.hintPrefix || state.entryHints.join(",") !== "0,1"
      );
    }

    addLetter(index) {
      if (
        this.state.status !== "playing" ||
        this.state.entry.length >= 5 ||
        this.usedIndices.includes(index) ||
        !this.state.letters[index]
      )
        return false;
      this.state.modeLocked = true;
      this.state.entry += this.state.letters[index];
      return true;
    }

    deleteLetter() {
      if (this.state.status !== "playing" || !this.state.entry) return false;
      this.state.entry = this.state.entry.slice(0, -1);
      this.state.entryHints = this.state.entryHints.filter(
        (column) => column < this.state.entry.length,
      );
      return true;
    }

    clearEntry() {
      this.state.entry = "";
      this.state.entryHints = [];
    }

    shuffle(random = Math.random) {
      if (this.state.status !== "playing") return false;
      const original = this.state.letters.join("");
      for (let attempt = 0; attempt < 30; attempt++) {
        const letters = [...this.state.letters];
        for (let i = letters.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        if (
          letters.join("") !== original &&
          !this.puzzle.words.includes(letters.join(""))
        ) {
          this.state.letters = letters;
          return true;
        }
      }
      for (let shift = 1; shift < 5; shift++) {
        const letters = this.state.letters
          .slice(shift)
          .concat(this.state.letters.slice(0, shift));
        if (
          letters.join("") !== original &&
          !this.puzzle.words.includes(letters.join(""))
        ) {
          this.state.letters = letters;
          return true;
        }
      }
      return false;
    }

    submit() {
      const state = this.state;
      if (state.status !== "playing" || state.entry.length !== 5)
        return { type: "ignored" };
      const word = canonical(state.entry);
      if (state.words.includes(word)) {
        this.clearEntry();
        return {
          type: "duplicate",
          word,
          message: `${word} was already found.`,
        };
      }
      if (!this.puzzle.words.includes(word)) {
        if (state.mode === "expert" && !state.invalidWords.includes(word))
          state.invalidWords.push(word);
        this.clearEntry();
        if (state.mode === "expert" && state.invalidWords.length >= 3)
          this.finish("failed");
        return {
          type: "invalid",
          word,
          message: `${word} is not a valid word.`,
        };
      }
      const previousScore = this.score;
      state.words.push(word);
      state.wordHints.push([...state.entryHints]);
      this.clearEntry();
      if (state.words.length === 5) this.finish("won");
      return {
        type: "accepted",
        word,
        points: this.score - previousScore,
        won: state.status === "won",
      };
    }

    hint() {
      if (!this.canHint) return false;
      const prefix = this.hintPrefix;
      if (!prefix) return false;
      this.state.entry = prefix;
      this.state.entryHints = [0, 1];
      if (!this.state.hintedRows.includes(this.state.words.length)) {
        this.state.hintedRows.push(this.state.words.length);
        this.state.hintUses++;
      }
      this.state.modeLocked = true;
      return prefix;
    }

    setMode(mode) {
      if (
        this.state.modeLocked ||
        this.state.status !== "playing" ||
        !["classic", "expert"].includes(mode)
      )
        return false;
      this.state.mode = mode;
      return true;
    }

    tick(milliseconds) {
      if (
        this.state.status === "playing" &&
        Number.isFinite(milliseconds) &&
        milliseconds > 0
      )
        this.state.elapsedMs += milliseconds;
    }

    record() {
      const record = copy({ ...this.state, original: null, isReplay: false });
      record.score = this.score;
      return record;
    }

    finish(status) {
      this.state.status = status;
      this.clearEntry();
      if (!this.state.original) this.state.original = this.record();
    }

    reveal() {
      if (this.state.status === "won" || this.state.status === "revealed")
        return false;
      this.state.revealedWords = this.puzzle.words
        .filter((word) => !this.state.words.includes(word))
        .slice(0, 5 - this.state.words.length);
      this.finish("revealed");
      return true;
    }

    reset() {
      this.state = this.fresh(this.state.mode, this.state.original);
      this.state.oneShot = false;
    }

    toJSON() {
      // A replay is intentionally session-only. Reloading returns the original
      // frozen result, exactly as leaving and returning to a native replay does.
      const saved =
        this.state.isReplay && this.state.original
          ? {
              ...copy(this.state.original),
              original: copy(this.state.original),
            }
          : copy(this.state);
      return { ...saved, settings: { ...this.settings } };
    }
  }

  if (typeof module !== "undefined" && module.exports)
    module.exports = DemoGame;
  else root.ViisiDemoGame = DemoGame;
})(typeof globalThis !== "undefined" ? globalThis : this);
