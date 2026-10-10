// grid.js
// Generates a 13x13 crossword grid with top-to-bottom symmetry
// Places black cells one at a time, validating before and after mirroring

const Grid = (() => {

  const SIZE         = 11;
  const TARGET_BLACK = 22;
  const MIN_WORD     = 3;
  const MAX_WORD     = 11;

  // ── 1. Create empty grid ───────────────────────────────────────────────────
  function createEmpty() {
    const grid = [];
    for (let r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < SIZE; c++) {
        grid[r][c] = {
          isBlack:    false,
          letter:     null,
          acrossSlot: null,
          downSlot:   null,
          clueNumber: null
        };
      }
    }
    return grid;
  }

  // ── 2. Count black cells ───────────────────────────────────────────────────
  function countBlack(grid) {
    let count = 0;
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c].isBlack) count++;
    return count;
  }

  // ── 3. Check for short words ───────────────────────────────────────────────
  function hasNoShortWords(grid) {
    for (let r = 0; r < SIZE; r++) {
      let run = 0;
      for (let c = 0; c <= SIZE; c++) {
        const isBlack = c === SIZE || grid[r][c].isBlack;
        if (!isBlack) {
          run++;
        } else {
          if (run > 0 && run < MIN_WORD) return false;
          run = 0;
        }
      }
    }

    for (let c = 0; c < SIZE; c++) {
      let run = 0;
      for (let r = 0; r <= SIZE; r++) {
        const isBlack = r === SIZE || grid[r][c].isBlack;
        if (!isBlack) {
          run++;
        } else {
          if (run > 0 && run < MIN_WORD) return false;
          run = 0;
        }
      }
    }

    return true;
  }

  // ── 4. Place black cells with symmetry ────────────────────────────────────
  function placeBlackCells(grid) {
    let       attempts  = 0;
    const     startTime = Date.now();

    while (countBlack(grid) < TARGET_BLACK && attempts < 10000) {
      attempts++;

      // Bail if taking too long
      if (Date.now() - startTime > 5000) {
        console.log("Grid placement timed out — using partial grid");
        break;
      }

      const r    = Math.floor(Math.random() * Math.ceil(SIZE / 2));
      const c    = Math.floor(Math.random() * SIZE);
      const mirR = SIZE - 1 - r;

      if (grid[r][c].isBlack) continue;
      if (grid[mirR][c].isBlack) continue;

      grid[r][c].isBlack    = true;
      grid[mirR][c].isBlack = true;

      if (!hasNoShortWords(grid)) {
        grid[r][c].isBlack    = false;
        grid[mirR][c].isBlack = false;
        continue;
      }
    }

    console.log(`Placed ${countBlack(grid)} black cells in ${attempts} attempts`);
  }

  // ── 5. Detect slots and assign clue numbers ────────────────────────────────
  function detectSlots(grid) {
    const slots = [];
    let   id    = 0;
    let   num   = 1;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c].isBlack) continue;
        const startsAcross = (c === 0 || grid[r][c-1].isBlack) &&
                             (c+1 < SIZE && !grid[r][c+1].isBlack);
        const startsDown   = (r === 0 || grid[r-1][c].isBlack) &&
                             (r+1 < SIZE && !grid[r+1][c].isBlack);
        if (startsAcross || startsDown) grid[r][c].clueNumber = num++;
      }
    }

    for (let r = 0; r < SIZE; r++) {
      let c = 0;
      while (c < SIZE) {
        if (!grid[r][c].isBlack) {
          const start = c;
          while (c < SIZE && !grid[r][c].isBlack) c++;
          const length = c - start;
          if (length >= MIN_WORD && length <= MAX_WORD) {
            const cells = [];
            for (let i = start; i < start + length; i++) cells.push({ row: r, col: i });
            slots.push({ id: id++, direction: "across", startRow: r, startCol: start, length, cells, clueNumber: grid[r][start].clueNumber });
          }
        } else c++;
      }
    }

    for (let c = 0; c < SIZE; c++) {
      let r = 0;
      while (r < SIZE) {
        if (!grid[r][c].isBlack) {
          const start = r;
          while (r < SIZE && !grid[r][c].isBlack) r++;
          const length = r - start;
          if (length >= MIN_WORD && length <= MAX_WORD) {
            const cells = [];
            for (let i = start; i < start + length; i++) cells.push({ row: i, col: c });
            slots.push({ id: id++, direction: "down", startRow: start, startCol: c, length, cells, clueNumber: grid[start][c].clueNumber });
          }
        } else r++;
      }
    }

    for (const slot of slots) {
      for (const { row, col } of slot.cells) {
        if (slot.direction === "across") grid[row][col].acrossSlot = slot.id;
        else grid[row][col].downSlot = slot.id;
      }
    }

    return slots;
  }

  // ── 6. Place a word into a slot ───────────────────────────────────────────
  function placeWord(grid, slot, word) {
    for (let i = 0; i < slot.cells.length; i++) {
      const { row, col } = slot.cells[i];
      grid[row][col].letter = word[i];
    }
  }

  // ── 7. Remove a word from a slot ──────────────────────────────────────────
  function removeWord(grid, slot) {
    for (const { row, col } of slot.cells) grid[row][col].letter = null;
  }

  // ── 8. Generate a valid grid ──────────────────────────────────────────────
  function generate() {
    const grid = createEmpty();
    placeBlackCells(grid);

    console.log(`Grid generated with ${countBlack(grid)} black cells`);
    const slots = detectSlots(grid);
    console.log(`${slots.length} slots detected`);

    return { grid, slots };
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return { generate, placeWord, removeWord };

})();