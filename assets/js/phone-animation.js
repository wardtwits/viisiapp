(function () {
  "use strict";

  const homeScreen = document.getElementById("viisi-demo-home");
  const gameScreen = document.getElementById("viisi-demo-game");
  const playButton = document.getElementById("viisi-demo-play");
  const canvas = document.getElementById("viisi-demo-canvas");

  if (!homeScreen || !gameScreen || !playButton || !canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FONT = "Nunito, system-ui, -apple-system, sans-serif";
  const font = (weight, size) => `${weight} ${size}px ${FONT}`;

  // Keep the letters in sync with the "Today" card in index.html.
  const initialLetters = ["E", "A", "S", "T", "R"];
  const rows = 5;
  const cols = 5;
  const wordsToWin = 5;
  const pointsPerWord = 20;
  const completionBonus = 20;

  const definitions = {
    STARE: "To look fixedly with the eyes wide open.",
    TEARS: "(plural of Tear) Drops of salty fluid from the eyes.",
    RATES: "(plural of Rate) Measures of speed or frequency.",
    ASTER: "A plant with daisy-like flowers.",
    TARES: "(plural of Tare) The weight of a container, deducted from the total.",
    RESAT: "(past tense of Resit) Sat an exam again.",
  };
  const demoSolveOrder = ["STARE", "TEARS", "RATES", "ASTER", "TARES"];

  // Dark and light follow the visitor's browser setting (prefers-color-scheme).
  const darkColors = {
    bgTop: "#1b2147",
    bgBottom: "#10142b",
    text: "#ffffff",
    muted: "#b9bcd6",
    title: "#54d1b4",
    date: "#54d1b4",
    status: "#ffffff",
    cellText: "#ffffff",
    red: "#fb4655",
    redEdge: "#b81f33",
    redDim: "rgba(251, 70, 85, 0.18)",
    rackDimText: "rgba(255, 255, 255, 0.22)",
    teal: "#54d1b4",
    gold: "#f6b13c",
    lock: "#00ba8b",
    lockEdge: "#067a5c",
    shuffle: "#00ba8b",
    delete: "#7b819f",
    disabled: "#5b6180",
    ctrlShadow: "rgba(0, 0, 0, 0.35)",
    cellEmpty: "rgba(255, 255, 255, 0.05)",
    cellLine: "rgba(255, 255, 255, 0.16)",
    cellActive: "rgba(84, 209, 180, 0.1)",
    cellPlaced: "rgba(0, 186, 139, 0.24)",
    overlay: "8, 10, 24",
    decor: false,
  };

  const lightColors = {
    bgTop: "#ffffff",
    bgBottom: "#f1f1f7",
    text: "#2d3156",
    muted: "#6f7390",
    title: "#2d3156",
    date: "#2d3156",
    status: "#2d3156",
    cellText: "#2d3156",
    red: "#ea5560",
    redEdge: "#c23c48",
    redDim: "rgba(234, 85, 96, 0.16)",
    rackDimText: "rgba(234, 85, 96, 0.5)",
    teal: "#4fc4a8",
    gold: "#e9a825",
    lock: "#5cc9ae",
    lockEdge: "#3da58c",
    shuffle: "#5ccbb0",
    delete: "#9d9da6",
    disabled: "#cfcfd8",
    ctrlShadow: "rgba(45, 49, 86, 0.18)",
    cellEmpty: "#f3f3f6",
    cellLine: "#e3e3ea",
    cellActive: "#ffffff",
    cellPlaced: "rgba(92, 201, 174, 0.22)",
    overlay: "45, 49, 86",
    decor: true,
  };

  // The results sheet is the same navy panel in both themes.
  const sheet = {
    panel: "#383f6b",
    panelLight: "#474b78",
    text: "#ffffff",
    muted: "#b9bcd6",
    teal: "#54d1b4",
    scoreRed: "#ee5660",
  };

  const schemeQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: light)")
      : null;
  let colors = schemeQuery && schemeQuery.matches ? lightColors : darkColors;
  if (schemeQuery) {
    const onSchemeChange = (event) => {
      colors = event.matches ? lightColors : darkColors;
    };
    if (typeof schemeQuery.addEventListener === "function") {
      schemeQuery.addEventListener("change", onSchemeChange);
    } else if (typeof schemeQuery.addListener === "function") {
      schemeQuery.addListener(onSchemeChange);
    }
  }

  // Faint floating letter tiles behind the board in the light theme.
  const decorTiles = [
    { x: 0.03, y: 0.12, s: 46, r: -0.35, l: "W", c: "#bfeadc" },
    { x: 0.9, y: 0.07, s: 42, r: 0.2, l: "U", c: "#f7d0d4" },
    { x: 0.47, y: 0.19, s: 26, r: 0.5, l: "V", c: "#dadbe4" },
    { x: 0.95, y: 0.3, s: 50, r: 0.15, l: "R", c: "#dadbe4" },
    { x: 0.0, y: 0.42, s: 48, r: -0.1, l: "D", c: "#fbe3c3" },
    { x: 0.92, y: 0.53, s: 48, r: 0.5, l: "T", c: "#cfd9f5" },
    { x: 0.0, y: 0.6, s: 44, r: 0.2, l: "R", c: "#f7d0d4" },
    { x: 1.0, y: 0.86, s: 50, r: -0.2, l: "M", c: "#dadbe4" },
    { x: 0.1, y: 0.94, s: 42, r: 0.3, l: "Z", c: "#cfd9f5" },
    { x: 0.7, y: 0.91, s: 40, r: -0.3, l: "A", c: "#fbe3c3" },
    { x: 0.45, y: 0.975, s: 34, r: 0.2, l: "L", c: "#bfeadc" },
    { x: 0.9, y: 0.975, s: 52, r: -0.1, l: "Y", c: "#f7d0d4" },
  ];

  const today = new Date();
  const shortDate = today
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();
  const longDate = today
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();

  const defaultStatus = "Build a 5-letter word using each tile once.";

  let tiles = createTiles();
  let solved = [];
  let status = { text: defaultStatus, start: performance.now() };
  let phase = "play"; // "play" | "results"
  let inputLocked = false;
  let shakeStart = 0;
  let results = { start: 0, closing: 0, score: 0, elapsed: 0 };
  let confetti = [];
  let puzzleStart = performance.now();
  let lastFrame = performance.now();
  let hits = [];
  let demoActive = false;
  let demoTimers = [];
  let submitTimer = 0;
  let closeTimer = 0;
  let autoStartTimer = 0;
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function createTiles() {
    return initialLetters.map((letter, id) => ({
      id,
      letter,
      col: -1,
      animStart: 0,
      animType: "none",
    }));
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const lerp = (a, b, t) => a + (b - a) * t;

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function setStatus(text) {
    status = { text, start: performance.now() };
  }

  function activeRow() {
    return solved.length < rows ? solved.length : -1;
  }

  function placedTiles() {
    return tiles.filter((item) => item.col !== -1).sort((a, b) => a.col - b.col);
  }

  function resetGame() {
    clearTimeout(submitTimer);
    clearTimeout(closeTimer);
    tiles = createTiles();
    solved = [];
    phase = "play";
    inputLocked = false;
    shakeStart = 0;
    results = { start: 0, closing: 0, score: 0, elapsed: 0 };
    confetti = [];
    puzzleStart = performance.now();
    setStatus(defaultStatus);
  }

  function returnTilesToRack(list) {
    const now = performance.now();
    list.forEach((tile) => {
      tile.col = -1;
      tile.animStart = now;
      tile.animType = "return";
    });
  }

  function placeTile(id) {
    if (phase !== "play" || inputLocked) return;
    const tile = tiles.find((item) => item.id === id);
    if (!tile || tile.col !== -1) return;

    const filled = placedTiles().map((item) => item.col);
    let nextCol = -1;
    for (let col = 0; col < cols; col += 1) {
      if (!filled.includes(col)) {
        nextCol = col;
        break;
      }
    }
    if (nextCol === -1) return;

    tile.col = nextCol;
    tile.animStart = performance.now();
    tile.animType = "drop";
    setStatus(defaultStatus);

    if (filled.length + 1 === cols) {
      inputLocked = true;
      submitTimer = setTimeout(submitRow, reduceMotion ? 0 : 340);
    }
  }

  function removeLast() {
    if (phase !== "play" || inputLocked) return;
    const rowTiles = placedTiles();
    if (!rowTiles.length) return;

    returnTilesToRack([rowTiles[rowTiles.length - 1]]);
    setStatus("Letter removed.");
  }

  function shuffle() {
    if (phase !== "play" || inputLocked) return;
    const rackIndexes = [];
    tiles.forEach((tile, index) => {
      if (tile.col === -1) rackIndexes.push(index);
    });

    const letters = rackIndexes.map((index) => tiles[index].letter);
    for (let i = letters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    const now = performance.now();
    rackIndexes.forEach((tileIndex, index) => {
      tiles[tileIndex].letter = letters[index];
      tiles[tileIndex].animStart = now;
      tiles[tileIndex].animType = "return";
    });
    setStatus("Letters shuffled.");
  }

  function submitRow() {
    const word = placedTiles().map((tile) => tile.letter).join("");
    const now = performance.now();

    if (solved.some((entry) => entry.word === word)) {
      rejectRow("Already found.");
      return;
    }
    if (!definitions[word]) {
      rejectRow("Not a valid word.");
      return;
    }

    solved.push({ word, start: now });
    returnTilesToRack(tiles);
    inputLocked = false;

    if (solved.length >= wordsToWin) {
      winGame(now);
    } else {
      setStatus(`Nice! ${wordsToWin - solved.length} more to win.`);
    }
  }

  function rejectRow(message) {
    shakeStart = performance.now();
    setStatus(message);
    submitTimer = setTimeout(() => {
      returnTilesToRack(placedTiles());
      inputLocked = false;
    }, reduceMotion ? 0 : 450);
  }

  function winGame(now) {
    phase = "results";
    results = {
      start: now + (reduceMotion ? 0 : 900),
      closing: 0,
      score: solved.length * pointsPerWord + completionBonus,
      elapsed: now - puzzleStart,
    };
    setStatus("Well done!");
    if (!reduceMotion) spawnConfetti(now);
  }

  function closeResults() {
    if (phase !== "results" || results.closing) return;
    results.closing = performance.now();
    clearTimeout(closeTimer);
    closeTimer = setTimeout(resetGame, reduceMotion ? 0 : 380);
  }

  function spawnConfetti(now) {
    const palette = ["#fb4655", "#54d1b4", "#f6b13c", "#00ba8b", "#7d8cff", "#ffffff"];
    confetti = [];
    for (let i = 0; i < 70; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const speed = 160 + Math.random() * 300;
      confetti.push({
        x: width / 2,
        y: height * 0.38,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 12,
        w: 5 + Math.random() * 4,
        h: 8 + Math.random() * 6,
        color: palette[i % palette.length],
        born: now,
        life: 1800 + Math.random() * 900,
      });
    }
  }

  function stopDemo() {
    demoActive = false;
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
  }

  function startDemo() {
    stopDemo();
    demoActive = true;

    const schedule = (ms, fn) => {
      demoTimers.push(setTimeout(() => demoActive && fn(), ms));
    };
    const placeLetter = (letter) => {
      const tile = tiles.find((item) => item.col === -1 && item.letter === letter);
      if (tile) placeTile(tile.id);
    };
    const cycle = () => {
      if (!demoActive) return;
      let t = 700;
      schedule(t, shuffle);
      t += 750;
      schedule(t, shuffle);
      t += 1000;

      demoSolveOrder.forEach((word) => {
        word.split("").forEach((letter) => {
          schedule(t, () => placeLetter(letter));
          t += 300;
        });
        t += 1300; // submit, lock animation, and a beat before the next word
      });

      t += 900 + 8000; // sheet slides up, count-up, then the word list scrolls
      schedule(t, closeResults);
      t += 1800;
      schedule(t, cycle);
    };

    cycle();
  }

  function showGame() {
    homeScreen.classList.remove("is-active");
    gameScreen.classList.add("is-active");
    resetGame();
    resize();
    startDemo();
  }

  function showHome() {
    stopDemo();
    resetGame();
    gameScreen.classList.remove("is-active");
    homeScreen.classList.add("is-active");
  }

  function startGameFromCard() {
    if (autoStartTimer) {
      clearTimeout(autoStartTimer);
      autoStartTimer = 0;
    }
    if (!gameScreen.classList.contains("is-active")) showGame();
  }

  function resize() {
    const rect = gameScreen.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  }

  // ---- drawing helpers -------------------------------------------------

  function drawBackArrow(x, y) {
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 8);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 12, y + 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18, y);
    ctx.stroke();
  }

  function drawCrown(cx, cy, size) {
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy + size * 0.3);
    ctx.lineTo(cx - size / 2, cy - size * 0.25);
    ctx.lineTo(cx - size * 0.22, cy + size * 0.02);
    ctx.lineTo(cx, cy - size * 0.35);
    ctx.lineTo(cx + size * 0.22, cy + size * 0.02);
    ctx.lineTo(cx + size / 2, cy - size * 0.25);
    ctx.lineTo(cx + size / 2, cy + size * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  function drawSparkle(cx, cy, r, alpha) {
    ctx.save();
    ctx.globalAlpha *= clamp01(alpha);
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.fill();
    ctx.restore();
  }

  function drawTileFace(x, y, size, fill, edge, radius) {
    ctx.fillStyle = edge;
    roundRect(x, y + size * 0.09, size, size, radius);
    ctx.fill();
    ctx.fillStyle = fill;
    roundRect(x, y, size, size, radius);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    roundRect(x + size * 0.08, y + size * 0.07, size * 0.84, size * 0.32, radius * 0.6);
    ctx.fill();
  }

  function drawControl(x, y, size, fill, glyph, onTap) {
    ctx.fillStyle = colors.ctrlShadow;
    roundRect(x, y + 3, size, size, 10);
    ctx.fill();
    ctx.fillStyle = fill;
    roundRect(x, y, size, size, 10);
    ctx.fill();
    glyph(x + size / 2, y + size / 2);
    hits.push({ x, y, w: size, h: size, onTap });
  }

  function drawShuffleGlyph(cx, cy) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 6);
    ctx.lineTo(cx - 3, cy - 6);
    ctx.lineTo(cx + 6, cy + 6);
    ctx.lineTo(cx + 10, cy + 6);
    ctx.moveTo(cx - 9, cy + 6);
    ctx.lineTo(cx - 3, cy + 6);
    ctx.lineTo(cx + 1, cy + 1);
    ctx.moveTo(cx + 5, cy - 6);
    ctx.lineTo(cx + 10, cy - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 6);
    ctx.lineTo(cx + 7, cy - 9);
    ctx.moveTo(cx + 10, cy - 6);
    ctx.lineTo(cx + 7, cy - 3);
    ctx.moveTo(cx + 10, cy + 6);
    ctx.lineTo(cx + 7, cy + 9);
    ctx.moveTo(cx + 10, cy + 6);
    ctx.lineTo(cx + 7, cy + 3);
    ctx.stroke();
  }

  function drawDeleteGlyph(cx, cy) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy);
    ctx.lineTo(cx - 5, cy - 7);
    ctx.lineTo(cx + 10, cy - 7);
    ctx.lineTo(cx + 10, cy + 7);
    ctx.lineTo(cx - 5, cy + 7);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - 4);
    ctx.lineTo(cx + 6, cy + 4);
    ctx.moveTo(cx + 6, cy - 4);
    ctx.lineTo(cx - 1, cy + 4);
    ctx.stroke();
  }

  function wrapText(text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  // ---- scenes ----------------------------------------------------------

  function drawDecor() {
    const scale = width / 288;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.textAlign = "center";
    decorTiles.forEach((tile) => {
      const size = tile.s * scale;
      ctx.save();
      ctx.translate(tile.x * width, tile.y * height);
      ctx.rotate(tile.r);
      ctx.fillStyle = tile.c;
      roundRect(-size / 2, -size / 2, size, size, size * 0.26);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = font(800, Math.round(size * 0.5));
      ctx.fillText(tile.l, 0, 1);
      ctx.restore();
    });
    ctx.restore();
  }

  function drawBoard(now) {
    const pad = width * 0.05;
    const headerY = height * 0.065;
    const interactive = phase === "play";

    // Header: back, date, fast-forward + help.
    drawBackArrow(pad + 2, headerY);
    if (interactive) {
      hits.push({ x: pad - 6, y: headerY - 18, w: 40, h: 36, onTap: showHome });
    }

    ctx.textAlign = "center";
    ctx.fillStyle = colors.date;
    ctx.font = font(800, 11);
    ctx.fillText(shortDate, width / 2, headerY);

    const rightX = width - pad - 46;
    ctx.fillStyle = colors.red;
    ctx.beginPath();
    ctx.moveTo(rightX - 22, headerY - 7);
    ctx.lineTo(rightX - 13, headerY);
    ctx.lineTo(rightX - 22, headerY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rightX - 14, headerY - 7);
    ctx.lineTo(rightX - 5, headerY);
    ctx.lineTo(rightX - 14, headerY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rightX + 10, headerY, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = font(900, 11);
    ctx.fillText("?", rightX + 10, headerY + 1);

    // Mode title + running score.
    const modeY = height * 0.125;
    ctx.fillStyle = colors.title;
    ctx.font = font(800, 16);
    ctx.fillText("Classic Mode", width / 2, modeY);

    const liveScore = phase === "results"
      ? results.score
      : solved.length * pointsPerWord;
    ctx.font = font(900, 16);
    ctx.fillStyle = colors.gold;
    ctx.textAlign = "right";
    ctx.fillText(String(liveScore), width - pad, modeY);
    const scoreW = ctx.measureText(String(liveScore)).width;
    drawCrown(width - pad - scoreW - 14, modeY - 1, 17);

    if (solved.length === 0) {
      ctx.textAlign = "center";
      ctx.fillStyle = colors.muted;
      ctx.font = font(600, 10);
      ctx.fillText("Mode locks when the puzzle begins.", width / 2, height * 0.158);
    }

    // Grid.
    const gridTop = height * 0.2;
    const gridBottom = height * 0.64;
    const gap = 6;
    const cell = Math.min(
      (width - 2 * pad - gap * (cols - 1)) / cols,
      (gridBottom - gridTop - gap * (rows - 1)) / rows,
    );
    const gridW = cell * cols + gap * (cols - 1);
    const gridX = (width - gridW) / 2;
    const cellPos = (row, col) => ({
      x: gridX + col * (cell + gap),
      y: gridTop + row * (cell + gap),
    });

    // Rack geometry is needed up front so flying tiles know where to start.
    const rackTile = Math.min(44, (width - 2 * pad - 6 * 4) / 5);
    const rackGap = 6;
    const rackTotal = rackTile * 5 + rackGap * 4;
    const rackX = (width - rackTotal) / 2;
    const statusY = gridBottom + 22;
    const rackY = statusY + 26;
    const rackPos = (index) => ({ x: rackX + index * (rackTile + rackGap), y: rackY });

    const row = activeRow();
    const shakeP = shakeStart ? clamp01((now - shakeStart) / 400) : 1;
    const shakeX = shakeP < 1 ? Math.sin(shakeP * Math.PI * 6) * 5 * (1 - shakeP) : 0;
    const radius = Math.max(8, cell * 0.24);

    for (let r = 0; r < rows; r += 1) {
      const entry = solved[r];
      for (let c = 0; c < cols; c += 1) {
        const pos = cellPos(r, c);
        if (entry) {
          const p = clamp01((now - entry.start - c * 70) / 260);
          const scale = reduceMotion || p <= 0 || p >= 1 ? 1 : 1 + 0.12 * Math.sin(p * Math.PI);
          ctx.save();
          ctx.translate(pos.x + cell / 2, pos.y + cell / 2);
          ctx.scale(scale, scale);
          drawTileFace(-cell / 2, -cell / 2, cell - 1, colors.lock, colors.lockEdge, radius);
          ctx.fillStyle = "#ffffff";
          ctx.font = font(900, Math.round(cell * 0.5));
          ctx.textAlign = "center";
          ctx.fillText(entry.word[c], 0, 1);
          ctx.restore();
          continue;
        }

        const isActive = r === row;
        const dx = isActive ? shakeX : 0;
        ctx.fillStyle = isActive ? colors.cellActive : colors.cellEmpty;
        ctx.strokeStyle = isActive ? colors.teal : colors.cellLine;
        ctx.lineWidth = 2;
        roundRect(pos.x + 1 + dx, pos.y + 1, cell - 2, cell - 2, radius);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Letters placed in the active row (and the ones still flying in).
    const flights = [];
    if (row !== -1) {
      tiles.forEach((tile) => {
        if (tile.col === -1) return;
        const pos = cellPos(row, tile.col);
        const flightP = tile.animType === "drop" && !reduceMotion
          ? clamp01((now - tile.animStart) / 260)
          : 1;
        if (flightP < 1) {
          flights.push({ tile, pos, p: easeInOut(flightP) });
          return;
        }
        ctx.fillStyle = colors.cellPlaced;
        ctx.strokeStyle = colors.teal;
        ctx.lineWidth = 2;
        roundRect(pos.x + 1 + shakeX, pos.y + 1, cell - 2, cell - 2, radius);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = colors.cellText;
        ctx.font = font(900, Math.round(cell * 0.5));
        ctx.textAlign = "center";
        ctx.fillText(tile.letter, pos.x + cell / 2 + shakeX, pos.y + cell / 2 + 1);
      });
    }

    // Status line.
    const statusP = clamp01((now - status.start) / 300);
    ctx.globalAlpha = statusP;
    ctx.fillStyle = colors.status;
    ctx.font = font(700, 12);
    ctx.textAlign = "center";
    ctx.fillText(status.text, width / 2, statusY + (1 - statusP) * 6);
    ctx.globalAlpha = 1;

    // Rack.
    tiles.forEach((tile, index) => {
      const pos = rackPos(index);
      const placed = tile.col !== -1;
      let dy = 0;
      let scale = 1;
      if (!placed && tile.animType === "return" && !reduceMotion) {
        const p = clamp01((now - tile.animStart) / 320);
        dy = (1 - easeOutBack(p)) * 10;
        scale = 0.85 + easeOutBack(p) * 0.15;
      }

      ctx.save();
      ctx.translate(pos.x + rackTile / 2, pos.y + rackTile / 2 + dy);
      ctx.scale(scale, scale);
      if (placed) {
        ctx.fillStyle = colors.redDim;
        roundRect(-rackTile / 2, -rackTile / 2, rackTile, rackTile, 10);
        ctx.fill();
      } else {
        drawTileFace(-rackTile / 2, -rackTile / 2, rackTile, colors.red, colors.redEdge, 10);
      }
      ctx.fillStyle = placed ? colors.rackDimText : "#ffffff";
      ctx.font = font(900, Math.round(rackTile * 0.45));
      ctx.textAlign = "center";
      ctx.fillText(tile.letter, 0, 1);
      ctx.restore();

      if (!placed && interactive) {
        hits.push({
          x: pos.x,
          y: pos.y,
          w: rackTile,
          h: rackTile,
          onTap: () => {
            stopDemo();
            placeTile(tile.id);
          },
        });
      }
    });

    // Tiles in flight sit above everything on the board.
    flights.forEach(({ tile, pos, p }) => {
      const from = rackPos(tile.id);
      const size = lerp(rackTile, cell - 1, p);
      const x = lerp(from.x, pos.x, p);
      const y = lerp(from.y, pos.y, p) - Math.sin(p * Math.PI) * 14;
      drawTileFace(x, y, size, colors.red, colors.redEdge, Math.max(8, size * 0.24));
      ctx.fillStyle = "#ffffff";
      ctx.font = font(900, Math.round(size * 0.48));
      ctx.textAlign = "center";
      ctx.fillText(tile.letter, x + size / 2, y + size / 2 + 1);
    });

    // Controls.
    const ctrlY = rackY + rackTile + 16;
    const ctrlSize = 38;
    const ctrlGap = 10;
    const ctrlX = width / 2 - ctrlSize - ctrlGap / 2;
    const hasLetters = tiles.some((tile) => tile.col !== -1);
    drawControl(ctrlX, ctrlY, ctrlSize, colors.shuffle, drawShuffleGlyph, () => {
      stopDemo();
      shuffle();
    });
    drawControl(
      ctrlX + ctrlSize + ctrlGap,
      ctrlY,
      ctrlSize,
      hasLetters ? colors.delete : colors.disabled,
      drawDeleteGlyph,
      () => {
        stopDemo();
        removeLast();
      },
    );
    if (!interactive) hits = [];
  }

  function drawResults(now) {
    const t = now - results.start;
    if (t < 0) return;

    const closeT = results.closing ? clamp01((now - results.closing) / 350) : 0;
    const inP = reduceMotion ? 1 : easeOutCubic(clamp01(t / 500));
    const slide = reduceMotion ? closeT * height : (1 - inP) * height + closeT * height;

    ctx.fillStyle = `rgba(${colors.overlay}, ${0.55 * inP * (1 - closeT)})`;
    ctx.fillRect(0, 0, width, height);

    const sheetX = 10;
    const sheetW = width - 20;
    const restTop = height * 0.035;
    const sheetTop = restTop + slide;
    const inset = 14;

    ctx.save();
    ctx.translate(sheetX, sheetTop);

    ctx.fillStyle = sheet.panel;
    roundRect(0, 0, sheetW, height - restTop + 30, 26);
    ctx.fill();

    // Close button.
    const closeCx = sheetW - 26;
    const closeCy = 26;
    ctx.fillStyle = sheet.scoreRed;
    ctx.beginPath();
    ctx.arc(closeCx, closeCy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = sheet.text;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(closeCx - 5, closeCy - 5);
    ctx.lineTo(closeCx + 5, closeCy + 5);
    ctx.moveTo(closeCx + 5, closeCy - 5);
    ctx.lineTo(closeCx - 5, closeCy + 5);
    ctx.stroke();
    if (inP > 0.9 && !closeT) {
      hits.push({
        x: sheetX + closeCx - 18,
        y: sheetTop + closeCy - 18,
        w: 36,
        h: 36,
        onTap: () => {
          stopDemo();
          closeResults();
        },
      });
    }

    // Score count-up with sparkles.
    const countP = reduceMotion ? 1 : easeOutCubic(clamp01((t - 350) / 900));
    ctx.textAlign = "center";
    ctx.fillStyle = sheet.scoreRed;
    ctx.font = font(900, Math.round(sheetW * 0.2));
    ctx.fillText(String(Math.round(results.score * countP)), sheetW / 2, 66);

    const twinkle = (offset) => (reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(now / 260 + offset));
    drawSparkle(sheetW * 0.79, 52, 13, twinkle(0));
    drawSparkle(sheetW * 0.17, 62, 10, twinkle(1.7));
    drawSparkle(sheetW * 0.2, 44, 5, twinkle(3.1));

    ctx.fillStyle = sheet.muted;
    ctx.font = font(800, 15);
    ctx.fillText("SCORE", sheetW / 2, 112);
    ctx.font = font(800, 12);
    ctx.fillText(longDate, sheetW / 2, 134);

    // Time + hints tiles.
    const tileGap = 12;
    const tileW = (sheetW - inset * 2 - tileGap) / 2;
    const statY = 154;
    [
      { value: formatTime(results.elapsed), label: "TIME", color: sheet.teal, x: inset },
      { value: "0", label: "HINTS", color: sheet.teal, x: inset + tileW + tileGap },
    ].forEach((stat) => {
      ctx.fillStyle = sheet.panelLight;
      roundRect(stat.x, statY, tileW, 58, 16);
      ctx.fill();
      ctx.fillStyle = stat.color;
      ctx.font = font(800, 22);
      ctx.fillText(stat.value, stat.x + tileW / 2, statY + 25);
      ctx.fillStyle = sheet.muted;
      ctx.font = font(700, 11);
      ctx.fillText(stat.label, stat.x + tileW / 2, statY + 46);
    });

    ctx.fillStyle = sheet.muted;
    ctx.font = font(600, 11);
    ctx.fillText("10 points off for each hint used", sheetW / 2, 232);

    // Words found list, clipped and slowly auto-scrolling.
    ctx.textAlign = "left";
    ctx.fillStyle = sheet.muted;
    ctx.font = font(800, 12);
    ctx.fillText("WORDS FOUND", inset, 258);

    const listTop = 272;
    const listW = sheetW - inset * 2;
    const cardPad = 12;
    const cardGap = 8;
    ctx.font = font(600, 11.5);
    const cards = solved.map((entry) => {
      const lines = wrapText(definitions[entry.word] || "", listW - cardPad * 2);
      return { word: entry.word, lines, h: cardPad + 17 + lines.length * 15 + 6 };
    });
    const totalH = cards.reduce((sum, card) => sum + card.h + cardGap, 0);
    const visibleH = height - restTop - listTop - 6;
    const maxScroll = Math.max(0, totalH - visibleH);
    const scroll = reduceMotion ? 0 : Math.min(maxScroll, Math.max(0, (t - 3000) * 0.03));

    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, listTop, listW, visibleH);
    ctx.clip();
    let y = listTop - scroll;
    cards.forEach((card) => {
      ctx.fillStyle = sheet.panelLight;
      roundRect(inset, y, listW, card.h, 14);
      ctx.fill();
      ctx.fillStyle = sheet.teal;
      ctx.font = font(800, 15);
      ctx.fillText(card.word, inset + cardPad, y + cardPad + 6);
      ctx.fillStyle = sheet.text;
      ctx.font = font(600, 11.5);
      card.lines.forEach((line, i) => {
        ctx.fillText(line, inset + cardPad, y + cardPad + 26 + i * 15);
      });
      y += card.h + cardGap;
    });
    ctx.restore();

    ctx.restore();
  }

  function drawConfetti(now, dt) {
    if (!confetti.length) return;
    confetti = confetti.filter((piece) => now - piece.born < piece.life);
    confetti.forEach((piece) => {
      piece.vy += 520 * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.rot += piece.vr * dt;
      const fade = clamp01(1 - (now - piece.born) / piece.life);
      ctx.save();
      ctx.globalAlpha = Math.min(1, fade * 2);
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    });
  }

  function draw() {
    if (!gameScreen.classList.contains("is-active") || width < 80 || height < 160) {
      requestAnimationFrame(draw);
      return;
    }

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, colors.bgTop);
    bg.addColorStop(1, colors.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    hits = [];
    ctx.textBaseline = "middle";
    if (colors.decor) drawDecor();

    drawBoard(now);
    if (phase === "results") drawResults(now);
    drawConfetti(now, dt);

    requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (let i = hits.length - 1; i >= 0; i -= 1) {
      const hit = hits[i];
      if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) {
        hit.onTap();
        return;
      }
    }
  });

  playButton.addEventListener("click", startGameFromCard);
  window.addEventListener("resize", resize);

  resize();
  autoStartTimer = setTimeout(() => playButton.click(), 3000);
  requestAnimationFrame(draw);
})();
