// fill.js
// CSP backtracking algorithm that fills the crossword grid

const Fill = (() => {

  const TIME_LIMIT_MS = 8000;
  let   callCount     = 0;

  // ── Get current letter constraints for a slot ──────────────────────────────
  function getConstraints(grid, slot) {
    const constraints = [];
    for (let i = 0; i < slot.cells.length; i++) {
      const { row, col } = slot.cells[i];
      const letter       = grid[row][col].letter;
      if (letter !== null) {
        constraints.push({ pos: i, letter });
      }
    }
    return constraints;
  }

  // ── Get valid words for a slot given current grid state ───────────────────
  async function getValidWords(grid, slot) {
    const constraints = getConstraints(grid, slot);
    return await WordIndex.getWords(slot.length, constraints);
  }

  // ── Check if a slot is fully filled ───────────────────────────────────────
  function isFilled(grid, slot) {
    return slot.word !== null &&
           slot.word !== undefined &&
           slot.cells.every(({ row, col }) => grid[row][col].letter !== null);
  }

  // ── Pick the most constrained unfilled slot (MCV heuristic) ───────────────
  async function getMostConstrained(grid, slots) {
    let best      = null;
    let bestCount = Infinity;

    for (const slot of slots) {
      if (isFilled(grid, slot)) continue;

      const count = (await getValidWords(grid, slot)).length;

      if (count === 0) return { slot, count: 0 };

      if (count < bestCount) {
        bestCount = count;
        best      = slot;
      }
    }

    return { slot: best, count: bestCount };
  }

  // ── Check if all slots are filled ─────────────────────────────────────────
  function allFilled(grid, slots) {
    return slots.every(slot =>
      slot.word !== null &&
      slot.word !== undefined &&
      slot.cells.every(({ row, col }) => grid[row][col].letter !== null)
    );
  }

  // ── Shuffle array in place (Fisher-Yates) ─────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j          = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Core backtracking algorithm ────────────────────────────────────────────
  async function solve(grid, slots, usedWords = new Set(), startTime = Date.now()) {

    callCount++;
    if (callCount % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (Date.now() - startTime > TIME_LIMIT_MS) {
      console.log("Time limit reached — trying new grid template...");
      return false;
    }

    if (allFilled(grid, slots)) return true;

    const { slot, count } = await getMostConstrained(grid, slots);

    if (!slot || count === 0) return false;

    const candidates = shuffle(
      (await getValidWords(grid, slot)).filter(w => !usedWords.has(w))
    );

    for (const word of candidates) {

      if (Date.now() - startTime > TIME_LIMIT_MS) return false;

      Grid.placeWord(grid, slot, word);
      slot.word = word;
      usedWords.add(word);

      if (await solve(grid, slots, usedWords, startTime)) return true;

      Grid.removeWord(grid, slot);
      slot.word = null;
      usedWords.delete(word);
    }

    return false;
  }

  // ── Main entry point ───────────────────────────────────────────────────────
  async function generate(attempt = 1, maxAttempts = 20) {
    console.log(`Attempt ${attempt} of ${maxAttempts}...`);

    if (attempt > maxAttempts) {
      throw new Error("Could not generate a valid puzzle. Please try again.");
    }

    callCount = 0;

    console.log("Generating grid template...");
    const { grid, slots } = Grid.generate();

    if (slots.length < 40) {
      console.log("Grid slot count too low — retrying...");
      return generate(attempt + 1, maxAttempts);
    }

    console.log(`Filling ${slots.length} slots...`);
    const startTime = Date.now();
    const success   = await solve(grid, slots, new Set(), startTime);

    if (success) {
      const unfilled = slots.filter(s => !s.word);
      if (unfilled.length > 0) {
        console.log(`Warning: ${unfilled.length} unfilled slots — retrying...`);
        return generate(attempt + 1, maxAttempts);
      }
      console.log(`Puzzle generated successfully in ${Date.now() - startTime}ms`);
      return { grid, slots };
    } else {
      console.log("Fill failed - retrying with new grid template...");
      return generate(attempt + 1, maxAttempts);
    }
  }

  return { generate };

})();