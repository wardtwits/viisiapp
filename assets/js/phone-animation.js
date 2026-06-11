(function () {
  "use strict";

  const homeScreen = document.getElementById("viisi-demo-home");
  const gameScreen = document.getElementById("viisi-demo-game");
  const playButton = document.getElementById("viisi-demo-play");
  const canvas = document.getElementById("viisi-demo-canvas");

  if (!homeScreen || !gameScreen || !playButton || !canvas) return;

  const ctx = canvas.getContext("2d");
  const initialLetters = ["A", "F", "T", "E", "S"];
  const rows = 5;
  const cols = 5;

  const colors = {
    cream: "#f8efe2",
    text: "#0a192e",
    red: "#fb4655",
    redDim: "rgba(251, 70, 85, 0.25)",
    redText: "rgba(251, 70, 85, 0.4)",
    green: "#00ba8b",
    greenDark: "#2c8a5a",
    border: "#dfd2bf",
    empty: "rgba(248, 239, 226, 0.68)",
    white: "#ffffff",
    disabled: "#aaa",
    shadow: "rgba(0, 0, 0, 0.12)",
  };

  let tiles = createTiles();
  let status = { text: "Build a 5-letter word using each tile once.", start: performance.now() };
  let hits = [];
  let demoActive = false;
  let demoTimers = [];
  let autoStartTimer = 0;
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function createTiles() {
    return initialLetters.map((letter, id) => ({
      id,
      letter,
      row: -1,
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

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function setStatus(text) {
    status = { text, start: performance.now() };
  }

  function resetGame() {
    tiles = createTiles();
    setStatus("Build a 5-letter word using each tile once.");
  }

  function placeTile(id) {
    const tile = tiles.find((item) => item.id === id);
    if (!tile || tile.row !== -1) return;

    const filled = tiles.filter((item) => item.row === 0).map((item) => item.col);
    let nextCol = -1;
    for (let col = 0; col < cols; col += 1) {
      if (!filled.includes(col)) {
        nextCol = col;
        break;
      }
    }
    if (nextCol === -1) return;

    tile.row = 0;
    tile.col = nextCol;
    tile.animStart = performance.now();
    tile.animType = "drop";
    setStatus("Build a 5-letter word using each tile once.");
  }

  function removeLast() {
    const rowTiles = tiles.filter((item) => item.row === 0);
    if (!rowTiles.length) return;

    const last = rowTiles.reduce((a, b) => (a.col > b.col ? a : b));
    last.row = -1;
    last.col = -1;
    last.animStart = performance.now();
    last.animType = "return";
    setStatus("Letter removed.");
  }

  function shuffle() {
    const rackIndexes = [];
    tiles.forEach((tile, index) => {
      if (tile.row === -1) rackIndexes.push(index);
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
      const tile = tiles.find((item) => item.row === -1 && item.letter === letter);
      if (tile) placeTile(tile.id);
    };
    const cycle = () => {
      if (!demoActive) return;
      schedule(700, shuffle);
      schedule(1450, shuffle);
      schedule(2200, shuffle);
      schedule(3100, () => placeLetter("F"));
      schedule(3900, () => placeLetter("E"));
      schedule(4700, () => placeLetter("A"));
      schedule(5500, () => placeLetter("S"));
      schedule(6800, removeLast);
      schedule(7500, removeLast);
      schedule(8200, removeLast);
      schedule(8900, removeLast);
      schedule(12500, resetGame);
      schedule(14500, cycle);
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

  function drawControl(x, y, size, fill, glyph, onTap) {
    ctx.fillStyle = colors.shadow;
    roundRect(x, y + 3, size, size, 10);
    ctx.fill();
    ctx.fillStyle = fill;
    roundRect(x, y, size, size, 10);
    ctx.fill();
    glyph(x + size / 2, y + size / 2);
    hits.push({ x, y, w: size, h: size, onTap });
  }

  function drawShuffleGlyph(cx, cy) {
    ctx.strokeStyle = colors.white;
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
    ctx.strokeStyle = colors.white;
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

  function draw() {
    if (!gameScreen.classList.contains("is-active") || width < 80 || height < 160) {
      requestAnimationFrame(draw);
      return;
    }

    const now = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.cream;
    ctx.fillRect(0, 0, width, height);
    hits = [];
    ctx.textBaseline = "middle";

    const pad = width * 0.05;
    const headerY = height * 0.065;
    drawBackArrow(pad + 6, headerY);

    ctx.fillStyle = colors.greenDark;
    ctx.font = "800 11px Nunito, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WED, JUN 10", width / 2, headerY);

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
    ctx.font = "900 11px Nunito, system-ui";
    ctx.fillText("?", rightX + 10, headerY + 1);

    const expertY = height * 0.13;
    const expertText = "Expert Mode";
    ctx.font = "900 17px Nunito, system-ui";
    const expertTextWidth = ctx.measureText(expertText).width;
    const expertIcon = 22;
    const expertGap = 10;
    const expertGroupX = width / 2 - (expertIcon + expertGap + expertTextWidth) / 2;
    ctx.fillStyle = colors.green;
    roundRect(expertGroupX, expertY - 11, expertIcon, expertIcon, 6);
    ctx.fill();
    ctx.fillStyle = colors.white;
    ctx.font = "900 15px Nunito, system-ui";
    ctx.textAlign = "center";
    ctx.fillText("ϟ", expertGroupX + expertIcon / 2, expertY);
    ctx.fillStyle = colors.greenDark;
    ctx.font = "900 17px Nunito, system-ui";
    ctx.textAlign = "left";
    ctx.fillText(expertText, expertGroupX + expertIcon + expertGap, expertY);

    const gridTop = height * 0.19;
    const gridBottom = height * 0.62;
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

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const pos = cellPos(row, col);
        ctx.fillStyle = row === 0 ? colors.white : colors.empty;
        ctx.strokeStyle = row === 0 ? colors.green : colors.border;
        ctx.lineWidth = 2;
        roundRect(pos.x + 1, pos.y + 1, cell - 2, cell - 2, 10);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.font = `900 ${Math.round(cell * 0.5)}px Nunito, system-ui`;
    ctx.textAlign = "center";
    ctx.fillStyle = colors.greenDark;
    tiles.forEach((tile) => {
      if (tile.row < 0) return;
      const pos = cellPos(tile.row, tile.col);
      const scale = tile.animType === "drop"
        ? easeOutBack(Math.min(1, (now - tile.animStart) / 280))
        : 1;
      ctx.save();
      ctx.translate(pos.x + cell / 2, pos.y + cell / 2);
      ctx.scale(scale, scale);
      ctx.fillText(tile.letter, 0, 2);
      ctx.restore();
    });

    const triesY = gridBottom + 18;
    ctx.fillStyle = colors.red;
    ctx.font = "800 11px Nunito, system-ui";
    ctx.fillText("Invalid submissions allowed: 3 • 3 tries left", width / 2, triesY);

    const statusProgress = Math.min(1, (now - status.start) / 300);
    ctx.globalAlpha = statusProgress;
    ctx.fillStyle = colors.text;
    ctx.font = "800 12px Nunito, system-ui";
    ctx.fillText(status.text, width / 2, triesY + 22 + (1 - statusProgress) * 6);
    ctx.globalAlpha = 1;

    const rackTile = Math.min(44, (width - 2 * pad - 6 * 4) / 5);
    const rackGap = 6;
    const rackTotal = rackTile * 5 + rackGap * 4;
    const rackX = (width - rackTotal) / 2;
    const rackY = triesY + 44;

    tiles.forEach((tile, index) => {
      const x = rackX + index * (rackTile + rackGap);
      const placed = tile.row !== -1;
      let dy = 0;
      let scale = 1;
      if (!placed && tile.animType === "return") {
        const p = Math.min(1, (now - tile.animStart) / 320);
        dy = (1 - easeOutBack(p)) * 10;
        scale = 0.85 + easeOutBack(p) * 0.15;
      }

      ctx.save();
      ctx.translate(x + rackTile / 2, rackY + rackTile / 2 + dy);
      ctx.scale(scale, scale);
      ctx.fillStyle = colors.shadow;
      roundRect(-rackTile / 2, -rackTile / 2 + 4, rackTile, rackTile, 10);
      ctx.fill();
      ctx.fillStyle = placed ? colors.redDim : colors.red;
      roundRect(-rackTile / 2, -rackTile / 2, rackTile, rackTile, 10);
      ctx.fill();
      ctx.fillStyle = placed ? colors.redText : colors.white;
      ctx.font = `900 ${Math.round(rackTile * 0.45)}px Nunito, system-ui`;
      ctx.fillText(tile.letter, 0, 2);
      ctx.restore();

      if (!placed) {
        hits.push({
          x,
          y: rackY,
          w: rackTile,
          h: rackTile,
          onTap: () => {
            stopDemo();
            placeTile(tile.id);
          },
        });
      }
    });

    const ctrlY = rackY + rackTile + 14;
    const ctrlSize = 38;
    const ctrlGap = 10;
    const ctrlX = width / 2 - ctrlSize - ctrlGap / 2;
    const hasLetters = tiles.some((tile) => tile.row === 0);
    drawControl(ctrlX, ctrlY, ctrlSize, colors.green, drawShuffleGlyph, () => {
      stopDemo();
      shuffle();
    });
    drawControl(ctrlX + ctrlSize + ctrlGap, ctrlY, ctrlSize, hasLetters ? "#4b5563" : colors.disabled, drawDeleteGlyph, () => {
      stopDemo();
      removeLast();
    });

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
