const assert = require("node:assert/strict");
const test = require("node:test");
const Game = require("../assets/js/demo-game.js");
const data = require("../assets/demo/puzzles.json");
const create = () => new Game(data);
function enter(game, word) {
  for (const letter of word) {
    const index = game.state.letters.findIndex(
      (value, i) => value === letter && !game.usedIndices.includes(i),
    );
    assert.ok(game.addLetter(index), `enter ${letter} in ${word}`);
  }
  return game.submit();
}
function three(game) {
  ["HEALS", "HALES", "SHALE"].forEach((word) => enter(game, word));
}

test("native practice puzzle includes seven native answers and the Special Word", () => {
  const game = create();
  assert.deepEqual(game.state.letters, ["L", "E", "S", "H", "A"]);
  assert.equal(game.puzzle.words.length, 7);
  assert.deepEqual(game.puzzle.specialWords, ["SELAH"]);
});
for (const [mode, special, expected] of [
  ["classic", false, 120],
  ["expert", false, 150],
  ["classic", true, 145],
  ["expert", true, 175],
]) {
  test(`${mode}, Special Word ${special}: authoritative score ${expected}`, () => {
    const game = create();
    game.setMode(mode);
    three(game);
    enter(game, "LEASH");
    const result = enter(game, special ? "SELAH" : "HALSE");
    assert.equal(result.won, true);
    assert.equal(game.score, expected);
    assert.equal(game.state.original.score, expected);
    assert.equal(
      game.score,
      game.breakdown.reduce((sum, line) => sum + line.points, 0),
    );
  });
}
test("hints unlock after three words, replace partial entry, charge once per row, and survive reload", () => {
  let game = create();
  assert.equal(game.hint(), false);
  three(game);
  game.addLetter(0);
  assert.equal(game.hint(), "HA");
  assert.equal(game.state.entry, "HA");
  assert.deepEqual(game.state.entryHints, [0, 1]);
  assert.equal(game.score, 50);
  assert.equal(game.hint(), false);
  game = new Game(data, game.toJSON());
  assert.equal(game.score, 50);
  enter(game, "LSE");
  assert.deepEqual(game.state.wordHints[3], [0, 1]);
  assert.equal(game.hint(), "LE");
  assert.equal(game.hint(), false);
  enter(game, "ASH");
  assert.equal(game.score, 100);
  assert.equal(game.state.hintUses, 2);
});
test("deleting and replacing hinted letters removes provenance but retains the penalty", () => {
  const game = create();
  three(game);
  game.hint();
  game.deleteLetter();
  assert.deepEqual(game.state.entryHints, [0]);
  game.deleteLetter();
  enter(game, "HALSE");
  assert.deepEqual(game.state.wordHints[3], []);
  assert.equal(game.score, 70);
  assert.equal(game.state.hintUses, 1);
});
test("hints exclude Special Words", () => {
  const game = create();
  ["HALES", "HALSE", "HEALS", "LEASH"].forEach((word) => enter(game, word));
  assert.equal(game.hint(), "SH");
});
test("shuffle preserves entry, hint provenance, and maps used keys to the shuffled rack", () => {
  const game = create();
  three(game);
  game.hint();
  const before = game.state.letters.join("");
  assert.equal(
    game.shuffle(() => 0),
    true,
  );
  assert.notEqual(game.state.letters.join(""), before);
  assert.equal(game.state.entry, "HA");
  assert.deepEqual(game.state.entryHints, [0, 1]);
  assert.equal(
    game.usedIndices.map((i) => game.state.letters[i]).join(""),
    "HA",
  );
  enter(game, "LSE");
  assert.equal(game.state.words[3], "HALSE");
});
test("Expert counts only distinct invalid words and never charges duplicates", () => {
  const game = create();
  game.setMode("expert");
  assert.equal(game.hint(), false);
  enter(game, "HEALS");
  assert.equal(enter(game, "HEALS").type, "duplicate");
  assert.equal(game.state.invalidWords.length, 0);
  enter(game, "AEHLS");
  enter(game, "AEHLS");
  assert.equal(game.state.invalidWords.length, 1);
  enter(game, "AEHSL");
  enter(game, "AELHS");
  assert.equal(game.state.status, "failed");
  assert.equal(game.score, 20);
  assert.equal(game.addLetter(0), false);
  game.reveal();
  assert.equal(game.state.revealedWords.length, 4);
  assert.equal(game.state.original.status, "failed");
  assert.equal(game.state.original.score, 20);
});
test("Classic invalid words do not end the run", () => {
  const game = create();
  for (let i = 0; i < 4; i++) enter(game, "AEHLS");
  assert.equal(game.state.status, "playing");
  assert.equal(game.state.invalidWords.length, 0);
});
test("reveal keeps accepted words, fills only missing answers, and awards no completion", () => {
  const game = create();
  enter(game, "HEALS");
  game.addLetter(0);
  game.reveal();
  assert.deepEqual(game.state.words, ["HEALS"]);
  assert.equal(game.state.entry, "");
  assert.equal(game.state.revealedWords.length, 4);
  assert.ok(!game.state.revealedWords.includes("HEALS"));
  assert.equal(game.score, 20);
  assert.equal(game.reveal(), false);
});
test("replay cannot change the first terminal result; reload restores the original board", () => {
  const game = create();
  enter(game, "HEALS");
  game.reveal();
  const original = structuredClone(game.state.original);
  game.reset();
  assert.equal(game.state.isReplay, true);
  three(game);
  enter(game, "LEASH");
  enter(game, "SELAH");
  assert.equal(game.score, 145);
  assert.deepEqual(game.state.original, original);
  const restored = new Game(data, game.toJSON());
  assert.equal(restored.state.status, "revealed");
  assert.equal(restored.score, 20);
  assert.deepEqual(restored.state.words, ["HEALS"]);
});
test("legacy v4 progress migrates without changing words, hint charges, or partial entry", () => {
  const legacy = {
    displayLetters: ["T", "R", "A", "S", "E"],
    completedWords: ["STARE", "TEARS", "RATES"],
    currentWord: "AS",
    hintUses: 1,
    hintRowsUsed: [3],
  };
  const unchanged = structuredClone(legacy);
  const game = new Game(data, null, legacy);
  assert.equal(game.puzzle.id, "legacy-eastr");
  assert.equal(game.state.timeKnown, false);
  assert.equal(game.score, 50);
  assert.equal(game.state.entry, "AS");
  assert.deepEqual(game.state.words, legacy.completedWords);
  assert.deepEqual(legacy, unchanged);
  enter(game, "TER");
  enter(game, "TARES");
  assert.equal(game.score, 110);
});
test("invalid saved progress throws rather than silently discarding a run", () => {
  const invalid = create().toJSON();
  invalid.words = ["WRONG"];
  assert.throws(() => new Game(data, invalid), /invalid progress/);
  assert.deepEqual(invalid.words, ["WRONG"]);
});
test("mode locks on first entry and the timer stops at a terminal state", () => {
  const game = create();
  game.tick(1500);
  game.addLetter(0);
  game.deleteLetter();
  assert.equal(game.setMode("expert"), false);
  game.reveal();
  game.tick(3000);
  assert.equal(game.state.elapsedMs, 1500);
  game.reset();
  assert.equal(game.state.elapsedMs, 0);
  assert.equal(game.setMode("expert"), true);
});

test("a corrupt frozen result cannot silently replace the original", () => {
  const game = create();
  enter(game, "HEALS");
  game.reveal();
  const saved = game.toJSON();
  saved.original.words = ["WRONG"];
  assert.throws(() => new Game(data, saved), /invalid progress/);
});

test("repeated letters consume different keys and remain valid after shuffle", () => {
  const repeated = {
    defaultPuzzle: "repeat",
    puzzles: [
      {
        id: "repeat",
        letters: ["S", "E", "E", "D", "S"],
        words: ["SEEDS"],
        specialWords: [],
      },
    ],
  };
  const game = new Game(repeated);
  game.addLetter(1);
  game.addLetter(2);
  assert.equal(game.state.entry, "EE");
  assert.deepEqual(game.usedIndices, [1, 2]);
  assert.equal(game.addLetter(1), false);
  game.shuffle(() => 0);
  assert.equal(new Set(game.usedIndices).size, 2);
  assert.equal(
    game.usedIndices.map((i) => game.state.letters[i]).join(""),
    "EE",
  );
});

test("primitive saved values are rejected without treating them as a fresh run", () => {
  for (const saved of [false, 1, "broken", []]) {
    assert.throws(() => new Game(data, saved), /invalid progress/);
  }
});

test("a deleted hint can be restored on the same row without another penalty", () => {
  let game = create();
  three(game);
  const prefix = game.hint();
  game.deleteLetter();
  assert.equal(game.canHint, true);
  assert.equal(game.hint(), prefix);
  assert.equal(game.state.entry, prefix);
  assert.deepEqual(game.state.entryHints, [0, 1]);
  assert.equal(game.score, 50);
  assert.equal(game.state.hintUses, 1);
  assert.equal(game.canHint, false);
  game.clearEntry();
  game = new Game(data, game.toJSON());
  assert.equal(game.hint(), prefix);
  assert.equal(game.state.hintUses, 1);
  enter(game, "LSE");
  const secondPrefix = game.hint();
  assert.equal(game.state.hintUses, 2);
  game.clearEntry();
  assert.equal(game.canHint, true);
  assert.equal(game.hint(), secondPrefix);
  assert.equal(game.state.hintUses, 2);
  assert.equal(game.score, 60);
});

test("a recalled hint replaces other entry letters and restores hint provenance", () => {
  const game = create();
  three(game);
  game.hint();
  game.clearEntry();
  for (const letter of "SHE")
    game.addLetter(game.state.letters.indexOf(letter));
  assert.equal(game.hint(), "HA");
  assert.deepEqual(game.state.entryHints, [0, 1]);
  assert.equal(game.score, 50);
});

test("effects start enabled and an explicit mute is preserved when restoring", () => {
  const game = create();
  assert.equal(game.settings.sound, true);
  game.settings.sound = false;
  assert.equal(new Game(data, game.toJSON()).settings.sound, false);
});
